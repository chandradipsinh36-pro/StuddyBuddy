import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Upload,
  FileText,
  CheckCircle2,
  ExternalLink,
  X,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { resourceService } from '../../services/resourceService';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { CATEGORIES, RESOURCE_TYPES, DIFFICULTY_LEVELS, ROUTES } from '../../constants';
import type { Resource } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorResourceCreatePage.module.css';

export function TutorResourceEditPage() {
  const { id } = useParams<{ id: string }>();
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

  const [resource, setResource] = useState<Resource | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [type, setType] = useState('pdf');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [accessType, setAccessType] = useState('free');
  const [price, setPrice] = useState('199');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    subject?: string;
    customCategory?: string;
    price?: string;
    file?: string;
  }>({});

  useEffect(() => {
    const fetchResource = async () => {
      try {
        if (!id) return;
        const r = await resourceService.getMyResource(Number(id));

        // Strictly verify that the resource belongs to the currently logged in tutor
        const uploaderId = Number(r.uploadedBy || (r.uploader as any)?.id || (r as any).tutorId || 0);
        if (user?.id && uploaderId && uploaderId !== user.id) {
          toast.error('Access denied: You can only edit your own uploaded resources.');
          navigate(ROUTES.TUTOR_RESOURCES);
          return;
        }

        setResource(r);
        setTitle(r.title || r.filename || '');
        setDescription(r.description || '');
        setSubject(r.subject || 'Mathematics');

        const cat = r.category || CATEGORIES[0];
        if (CATEGORIES.includes(cat)) {
          setCategory(cat);
          setCustomCategory('');
        } else {
          setCategory('Other');
          setCustomCategory(cat);
        }

        setType(r.type || r.fileType || 'pdf');
        setDifficulty(r.difficulty || 'intermediate');
        setAccessType(r.accessType || (r.isLocked ? 'premium' : 'free'));
        setPrice(String(r.price ?? 199));
      } catch (e: any) {
        console.error(e);
        toast.error(e?.response?.data?.error?.message || 'Access denied: You can only edit your own uploaded resources.');
        navigate(ROUTES.TUTOR_RESOURCES);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id, navigate, user?.id]);

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

    setNewFile(f);
    if (formErrors.file) setFormErrors(prev => ({ ...prev, file: undefined }));
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
      errors.description = 'Description is required';
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

    if (category === 'Other' && !customCategory.trim()) {
      errors.customCategory = 'Please enter your custom category name';
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

    if (newFile) {
      const ext = newFile.name.split('.').pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        errors.file = 'Invalid file extension. Allowed: PDF, PPT, Word, Video, MP3, Images';
      } else if (newFile.size > 50 * 1024 * 1024) {
        errors.file = 'File size cannot exceed 50MB';
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please resolve form validation errors before proceeding.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const finalCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category;
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('subject', subject.trim());
      fd.append('category', finalCategory);
      fd.append('type', type);
      fd.append('fileType', type);
      fd.append('difficulty', difficulty);
      fd.append('accessType', accessType);
      if (accessType === 'premium') {
        fd.append('price', price);
      } else {
        fd.append('price', '0');
      }
      if (newFile) {
        fd.append('file', newFile);
      }

      await resourceService.updateResource(Number(id), fd);
      toast.success(newFile ? 'Resource and attachment updated (old file deleted)!' : 'Resource details updated successfully!');
      navigate(ROUTES.TUTOR_RESOURCES);
    } catch {
      toast.error('Failed to update resource.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading resource details...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to={ROUTES.TUTOR_RESOURCES} className={styles.backLink}>
        <ArrowLeft size={16} /> Back to My Resources
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Edit Teaching Resource</h1>
        <p className={styles.subtitle}>Update resource content, subject, category, and file attachment.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSave} className={styles.form} noValidate>
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
            <Input
              label="Subject Discipline *"
              placeholder="e.g. Mathematics, Physics, Organic Chemistry"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (formErrors.subject) setFormErrors(fe => ({ ...fe, subject: undefined }));
              }}
              error={formErrors.subject}
              required
            />
            <Select
              label="Content Category *"
              options={[
                ...CATEGORIES.map(c => ({ value: c, label: c })),
                { value: 'Other', label: 'Other' },
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {category === 'Other' && (
            <Input
              label="Custom Category Name *"
              placeholder="e.g. Lab Manual, Cheatsheet, Formula Book..."
              value={customCategory}
              onChange={(e) => {
                setCustomCategory(e.target.value);
                if (formErrors.customCategory) setFormErrors(fe => ({ ...fe, customCategory: undefined }));
              }}
              error={formErrors.customCategory}
              required
            />
          )}

          {/* Material Format & Difficulty Level (Matching Upload Page) */}
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

          {/* Access Model & Pricing (Matching Upload Page) */}
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

          {/* Current File Display */}
          {resource?.fileUrl && (
            <div style={{
              backgroundColor: 'var(--color-gray-50)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                <FileText size={20} color="var(--color-primary-600)" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Currently Attached File
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {resource.fileUrl.split('/').pop()}
                  </div>
                </div>
              </div>
              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-primary-600)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={14} /> View File
              </a>
            </div>
          )}

          {/* Replace Resource File Attachment */}
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)', marginBottom: 'var(--space-2)', display: 'block' }}>
              Replace Resource File Attachment
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.mov,.webm,.mkv,.avi,.mp3,.wav,.m4a,.ogg,.aac,.png,.jpg,.jpeg,.webp,.gif"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <div
              className={`${styles.dropzone} ${newFile ? styles.fileActive : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {newFile ? (
                <>
                  <CheckCircle2 size={32} color="var(--color-success)" />
                  <span style={{ fontWeight: 'bold' }}>{newFile.name}</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                    {(newFile.size / 1024 / 1024).toFixed(2)} MB — Click to choose different file
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'var(--space-1)', color: 'var(--color-warning)', fontSize: 'var(--font-size-xs)' }}>
                    <AlertTriangle size={14} />
                    <span>Saving will replace the existing file and delete the old one permanently.</span>
                  </div>
                </>
              ) : (
                <>
                  <Upload size={32} color="var(--color-primary-500)" />
                  <span style={{ fontWeight: 'bold', color: 'var(--color-primary-700)' }}>
                    Click or drag new file to replace attachment
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                    Supports PDF, PPT, Word, Video, MP3, and Images up to 50MB
                  </span>
                </>
              )}
            </div>

            {newFile && (
              <div style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  leftIcon={<X size={14} />}
                >
                  Cancel file replacement (keep current file)
                </Button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
            <ShieldCheck size={16} color="var(--color-success)" />
            <span>Automated text safety & quality check will run immediately upon upload.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Link to={ROUTES.TUTOR_RESOURCES}>
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={saving} leftIcon={<Save size={16} />}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
