import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Upload, Video, Clock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { tutorService } from '../../services/tutorService';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Button } from '../../components/ui/Button/Button';
import { SUBJECTS, ROUTES } from '../../constants';
import toast from 'react-hot-toast';
import styles from './TutorOnboarding.module.css';

const STEPS = [
  { label: 'Personal Info', icon: '👤' },
  { label: 'Teaching', icon: '📚' },
  { label: 'Documents', icon: '📋' },
  { label: 'Trial Video', icon: '🎥' },
  { label: 'Submit', icon: '✅' },
];

const APPLICATION_STATUS_CONFIG = {
  pending:      { label: 'Application Submitted', icon: <Loader size={24} />, color: 'warning', desc: 'Your application is queued for review.' },
  under_review: { label: 'Under Review', icon: <Clock size={24} />, color: 'primary', desc: 'Our team is reviewing your application. This usually takes 2–3 business days.' },
  approved:     { label: 'Application Approved!', icon: <CheckCircle size={24} />, color: 'success', desc: 'Congratulations! You are now a verified StudyBuddy tutor.' },
  rejected:     { label: 'Application Not Approved', icon: <AlertCircle size={24} />, color: 'error', desc: 'Unfortunately your application was not approved. Please review the feedback and resubmit.' },
  needs_changes: { label: 'Changes Required', icon: <AlertCircle size={24} />, color: 'warning', desc: 'Please review the requested changes and resubmit your application.' },
};

export function TutorOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appStatus] = useState<'pending' | 'under_review' | 'approved' | 'rejected' | 'needs_changes' | null>(null);

  const [formData, setFormData] = useState({
    name: '', bio: '', phone: '', subjects: [] as string[],
    experience: '', skills: '', documents: [] as File[],
    trialVideoFile: null as File | null, trialVideoUrl: '',
    trialVideoDuration: 0,
  });

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v instanceof File) fd.append(k, v);
        else if (Array.isArray(v)) v.forEach(item => fd.append(k, item instanceof File ? item : String(item)));
        else fd.append(k, String(v));
      });
      await tutorService.submitOnboarding(fd);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted || appStatus) {
    const status = appStatus || 'pending';
    const cfg = APPLICATION_STATUS_CONFIG[status];
    return (
      <div className={styles.statusPage}>
        <div className={`${styles.statusCard} ${styles[`status_${cfg.color}`]}`}>
          <div className={styles.statusIcon}>{cfg.icon}</div>
          <h1 className={styles.statusTitle}>{cfg.label}</h1>
          <p className={styles.statusDesc}>{cfg.desc}</p>
          {status === 'approved' && (
            <Button onClick={() => navigate(ROUTES.TUTOR_DASHBOARD)}>Go to Dashboard</Button>
          )}
          {status === 'rejected' && (
            <Button onClick={() => setSubmitted(false)}>Edit & Resubmit</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tutor Onboarding</h1>
        <p className={styles.subtitle}>Complete all steps to start teaching on StudyBuddy</p>
      </div>

      {/* Step indicator */}
      <div className={styles.steps}>
        {STEPS.map((s, i) => (
          <div key={i} className={`${styles.step} ${i <= step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}>
            <div className={styles.stepCircle}>
              {i < step ? <Check size={16} /> : <span>{s.icon}</span>}
            </div>
            <span className={styles.stepLabel}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className={styles.content}>
        {step === 0 && (
          <div className={styles.stepContent}>
            <h2>Personal Information</h2>
            <div className={styles.formGrid}>
              <Input label="Full Name" value={formData.name} onChange={e => updateFormData({ name: e.target.value })} placeholder="Dr. John Smith" />
              <Input label="Phone Number" value={formData.phone} onChange={e => updateFormData({ phone: e.target.value })} placeholder="+91 9876543210" type="tel" />
            </div>
            <Textarea label="Professional Bio" value={formData.bio} onChange={e => updateFormData({ bio: e.target.value })} placeholder="Tell students about your background, expertise, and teaching approach..." rows={5} />
          </div>
        )}

        {step === 1 && (
          <div className={styles.stepContent}>
            <h2>Teaching Information</h2>
            <div>
              <p className={styles.fieldLabel}>Subjects you teach (select all that apply)</p>
              <div className={styles.subjectGrid}>
                {SUBJECTS.map(s => (
                  <button
                    key={s} type="button"
                    className={`${styles.subjectTag} ${formData.subjects.includes(s) ? styles.subjectTagActive : ''}`}
                    onClick={() => toggleSubject(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Years of Teaching Experience" value={formData.experience} onChange={e => updateFormData({ experience: e.target.value })} type="number" placeholder="e.g. 5" />
            <Input label="Key Skills (comma-separated)" value={formData.skills} onChange={e => updateFormData({ skills: e.target.value })} placeholder="Calculus, Linear Algebra, Statistics, Python..." />
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <h2>Qualifications</h2>
            <p className={styles.fieldNote}>Please upload documents to verify your qualifications (degree certificates, ID proof, etc.)</p>
            <div className={styles.uploadArea}>
              <input
                type="file" id="doc-upload" multiple accept=".pdf,.jpg,.jpeg,.png"
                className={styles.fileInput}
                onChange={e => updateFormData({ documents: Array.from(e.target.files || []) })}
              />
              <label htmlFor="doc-upload" className={styles.uploadLabel}>
                <Upload size={32} />
                <span>Click to upload qualifications</span>
                <span className={styles.uploadHint}>PDF, JPG, PNG up to 10MB each</span>
              </label>
            </div>
            {formData.documents.length > 0 && (
              <div className={styles.fileList}>
                {formData.documents.map((f, i) => (
                  <div key={i} className={styles.fileItem}>
                    <span>{f.name}</span>
                    <span className={styles.fileSize}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContent}>
            <h2>Trial Video</h2>
            <div className={styles.trialInfo}>
              <AlertCircle size={20} className={styles.trialInfoIcon} />
              <div>
                <strong>Required: 5-minute trial video</strong>
                <p>Record a 5-minute teaching demonstration showing your teaching style and subject expertise. This video is shown to students on your profile.</p>
              </div>
            </div>
            <div className={styles.uploadArea}>
              <input
                type="file" id="video-upload" accept="video/*"
                className={styles.fileInput}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) updateFormData({ trialVideoFile: file });
                }}
              />
              <label htmlFor="video-upload" className={styles.uploadLabel}>
                <Video size={32} />
                <span>{formData.trialVideoFile ? formData.trialVideoFile.name : 'Click to upload your trial video'}</span>
                <span className={styles.uploadHint}>MP4, MOV, WebM up to 500MB • Minimum 5 minutes</span>
              </label>
            </div>
            {formData.trialVideoFile && (
              <div className={styles.videoPreview}>
                <video controls className={styles.videoPlayer}>
                  <source src={URL.createObjectURL(formData.trialVideoFile)} />
                </video>
                <Button variant="ghost" size="sm" onClick={() => updateFormData({ trialVideoFile: null })}>
                  Replace Video
                </Button>
              </div>
            )}
            <div style={{ margin: '24px 0', textAlign: 'center', color: 'var(--color-gray-500)', fontSize: 14, fontWeight: 500 }}>— OR —</div>
            <Input 
              label="Trial Video Link (YouTube, Vimeo, Google Drive)" 
              value={formData.trialVideoUrl} 
              onChange={e => updateFormData({ trialVideoUrl: e.target.value })} 
              placeholder="https://..." 
            />
          </div>
        )}

        {step === 4 && (
          <div className={styles.stepContent}>
            <h2>Review & Submit</h2>
            <div className={styles.reviewSection}>
              <div className={styles.reviewItem}><span>Name:</span><span>{formData.name || '—'}</span></div>
              <div className={styles.reviewItem}><span>Subjects:</span><span>{formData.subjects.join(', ') || '—'}</span></div>
              <div className={styles.reviewItem}><span>Experience:</span><span>{formData.experience ? `${formData.experience} years` : '—'}</span></div>
              <div className={styles.reviewItem}><span>Documents:</span><span>{formData.documents.length} file(s) uploaded</span></div>
              <div className={styles.reviewItem}><span>Trial Video:</span><span>{formData.trialVideoFile ? '✓ Uploaded' : (formData.trialVideoUrl ? '✓ Link Provided' : '⚠ Missing')}</span></div>
            </div>
            <div className={styles.submitNote}>
              <AlertCircle size={16} />
              <p>By submitting, you agree to StudyBuddy's Tutor Terms of Service. Your application will be reviewed by our team within 2–3 business days.</p>
            </div>
          </div>
        )}

        <div className={styles.navigation}>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} rightIcon={<ChevronRight size={16} />}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={submitting}>
              Register and request to become tutor
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
