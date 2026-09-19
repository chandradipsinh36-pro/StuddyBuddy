import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle2, ShieldCheck, ShieldAlert, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { resourceService } from '../../services/resourceService';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { ProgressBar } from '../../components/ui/ProgressBar/ProgressBar';
import { SubjectAutocomplete } from '../../components/ui/SubjectAutocomplete/SubjectAutocomplete';
import { RESOURCE_TYPES, DIFFICULTY_LEVELS, ROUTES } from '../../constants';
import toast from 'react-hot-toast';
import styles from './TutorResourceCreatePage.module.css';

export function TutorResourceCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = [
    'pdf',
    'ppt', 'pptx',
    'doc', 'docx',
    'mp4', 'mov', 'webm', 'mkv', 'avi',
    'mp3', 'wav', 'm4a', 'ogg', 'aac',
    'png', 'jpg', 'jpeg', 'webp', 'gif',
  ];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('pdf');
  const [videoUrl, setVideoUrl] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [accessType, setAccessType] = useState('free');
  const [price, setPrice] = useState('199');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    subject?: string;
    category?: string;
    videoUrl?: string;
    price?: string;
    file?: string;
  }>({});

  if (!user?.isVerified) {
    return (
      <div className={styles.page}>
        <Link to={ROUTES.TUTOR_DASHBOARD} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-10)',
          textAlign: 'center',
          maxWidth: 600,
          margin: 'var(--space-8) auto',
        }}>
          <ShieldAlert size={48} color="#D97706" style={{ margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
            Admin Approval Required
          </h2>
          <p style={{ color: 'var(--color-gray-600)', marginTop: 'var(--space-2)', lineHeight: 1.6 }}>
            Your tutor approval application is currently under review by our admin team. Once the administrator verifies your qualification certificate, trial video lecture, and degree details, resource uploading will be automatically enabled for your account.
          </p>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link to={ROUTES.TUTOR_DASHBOARD}>
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error('Only PDF, PPT, Word, Video, MP3, and Images are acceptable.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Auto-detect format to assist tutor
    if (['pdf'].includes(ext)) setType('pdf');
    else if (['ppt', 'pptx'].includes(ext)) setType('ppt');
    else if (['doc', 'docx'].includes(ext)) setType('test_paper');
    else if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext)) setType('youtube');
    else if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)) setType('audio');
    else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) setType('image');

    setFile(f);
    if (formErrors.file) {
      setFormErrors(prev => ({ ...prev, file: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Resource title is required';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (trimmedTitle.length > 150) {
      errors.title = 'Title cannot exceed 150 characters';
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = 'Description is required to help students understand the material';
    } else if (trimmedDesc.length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    } else if (trimmedDesc.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }

    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      errors.subject = 'Subject discipline is required';
    } else if (trimmedSubject.length < 2) {
      errors.subject = 'Subject must be at least 2 characters long';
    }

    const trimmedCategory = category.trim();
    if (!trimmedCategory) {
      errors.category = 'Content category is required';
    } else if (trimmedCategory.length < 2) {
      errors.category = 'Content category must be at least 2 characters long';
    }

    if (accessType === 'premium') {
      if (!price || price.trim() === '') {
        errors.price = 'Price is required for premium resources';
      } else {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum)) {
          errors.price = 'Please enter a valid price number';
        } else if (priceNum < 1) {
          errors.price = 'Price must be at least ₹1';
        } else if (priceNum > 50000) {
          errors.price = 'Price cannot exceed ₹50,000';
        }
      }
    }

    if (type === 'youtube') {
      const trimmedVideo = videoUrl.trim();
      if (!trimmedVideo) {
        errors.videoUrl = 'YouTube video link is required';
      } else {
        const ytRegex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?.*?v=|embed\/|shorts\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/i;
        if (!ytRegex.test(trimmedVideo)) {
          errors.videoUrl = 'Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)';
        }
      }
    } else {
      if (!file) {
        errors.file = 'Please attach the study material file';
      } else if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
          errors.file = 'Invalid file extension. Allowed: PDF, PPT, Word, Video, MP3, Images';
        } else if (file.size > 50 * 1024 * 1024) {
          errors.file = 'File size cannot exceed 50MB';
        }
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please resolve form validation errors before proceeding.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 25;
      });
    }, 200);

    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('subject', subject.trim());
      fd.append('category', category.trim());
      fd.append('type', type);
      fd.append('difficulty', difficulty);
      fd.append('accessType', accessType);
      if (accessType === 'premium') fd.append('price', price);
      if (type === 'youtube') {
        fd.append('fileUrl', videoUrl.trim());
        fd.append('videoUrl', videoUrl.trim());
      } else if (file) {
        fd.append('file', file);
      }

      await resourceService.createResource(fd);
      setUploadProgress(100);
      clearInterval(interval);
      toast.success('Resource submitted for processing and safety validation!');
      navigate(ROUTES.TUTOR_RESOURCES);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to upload resource. Please try again.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to={ROUTES.TUTOR_RESOURCES} className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Resources
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Upload Teaching Resource</h1>
        <p className={styles.subtitle}>
          Share study notes, worksheets, past papers, or video walkthroughs with thousands of students.
        </p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Resource Title *"
            placeholder="e.g. Complete Calculus Notes — Differentiation & Integration"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (formErrors.title) setFormErrors(fe => ({ ...fe, title: undefined }));
            }}
            error={formErrors.title}
            required
          />

          <Textarea
            label="Description & Learning Objectives *"
            placeholder="Describe what concepts are covered, target grade level, and how students will benefit..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (formErrors.description) setFormErrors(fe => ({ ...fe, description: undefined }));
            }}
            error={formErrors.description}
            rows={4}
            required
          />

          <div className={styles.row}>
            <SubjectAutocomplete
              label="Subject Discipline *"
              placeholder="Search or type subject (e.g. Mathematics, Python, Physics)..."
              value={subject}
              onChange={(val) => {
                setSubject(val);
                if (formErrors.subject) setFormErrors(fe => ({ ...fe, subject: undefined }));
              }}
              error={formErrors.subject}
              required
            />
            <Input
              label="Content Category *"
              placeholder="e.g. Lecture Notes, Exam Preparation, Formula Sheet, Lab Manual..."
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (formErrors.category) setFormErrors(fe => ({ ...fe, category: undefined }));
              }}
              error={formErrors.category}
              required
            />
          </div>

          <div className={styles.row}>
            <Select
              label="Material Format *"
              options={RESOURCE_TYPES.map(t => ({ value: t.value, label: t.label }))}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
            <Select
              label="Difficulty Level *"
              options={DIFFICULTY_LEVELS.map(d => ({ value: d.value, label: d.label }))}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
          </div>

          {/* Access & Pricing */}
          <div className={styles.row}>
            <Select
              label="Access Model *"
              options={[
                { value: 'free', label: 'Free (Open to all students)' },
                { value: 'premium', label: 'Premium (Paid Purchase)' },
              ]}
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
            />

            {accessType === 'premium' && (
              <Input
                label="Price (INR ₹) *"
                type="number"
                min="1"
                placeholder="199"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (formErrors.price) setFormErrors(fe => ({ ...fe, price: undefined }));
                }}
                error={formErrors.price}
                helper="You earn 85% of this price on every student purchase"
                required
              />
            )}
          </div>

          {/* Resource Attachment: YouTube Link vs File Upload Dropzone */}
          {type === 'youtube' ? (
            <div>
              <Input
                label="YouTube Video Link *"
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (formErrors.videoUrl) setFormErrors(fe => ({ ...fe, videoUrl: undefined }));
                }}
                error={formErrors.videoUrl}
                helper="Paste the full YouTube video link for students to watch this video lecture"
                leftIcon={<Video size={16} color="#ef4444" />}
                required
              />
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)', marginBottom: 'var(--space-2)', display: 'block' }}>
                Resource File Attachment *
              </label>
              {formErrors.file && (
                <p style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 6 }}>
                  {formErrors.file}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.mov,.webm,.mkv,.avi,.mp3,.wav,.m4a,.ogg,.aac,.png,.jpg,.jpeg,.webp,.gif"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <div
                className={`${styles.dropzone} ${file ? styles.fileActive : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <>
                    <CheckCircle2 size={32} color="var(--color-success)" />
                    <span style={{ fontWeight: 'bold' }}>{file.name}</span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB — Click to choose different file
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={32} color="var(--color-primary-500)" />
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary-700)' }}>
                      Click or drag file to upload
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                      Supports PDF, PPT, Word, Video, MP3, and Images up to 50MB
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {uploading && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: 4 }}>
                <span>Scanning safety and OCR extracting...</span>
                <span>{uploadProgress}%</span>
              </div>
              <ProgressBar value={uploadProgress} size="sm" variant="default" />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
            <ShieldCheck size={16} color="var(--color-success)" />
            <span>Automated text safety & quality check will run immediately upon upload.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Link to={ROUTES.TUTOR_RESOURCES}>
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={uploading} leftIcon={<FileText size={16} />}>
              Publish Resource
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
