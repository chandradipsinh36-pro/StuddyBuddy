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

  useEffect(() => {
    const fetchResource = async () => {
      try {
        if (!id) return;
        const r = await resourceService.getResource(Number(id));
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
      } catch (e) {
        console.error(e);
        toast.error('Failed to load resource details.');
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id]);

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
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!title.trim()) {
      toast.error('Please enter a title.');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject discipline.');
      return;
    }
    if (category === 'Other' && !customCategory.trim()) {
      toast.error('Please enter your custom category name.');
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
        <form onSubmit={handleSave} className={styles.form}>
          <Input
            label="Resource Title *"
            placeholder="e.g. Complete Calculus Notes — Differentiation & Integration"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Description & Learning Objectives *"
            placeholder="Describe what concepts are covered, target grade level, and how students will benefit..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />

          <div className={styles.row}>
            <Input
              label="Subject Discipline *"
              placeholder="e.g. Mathematics, Physics, Organic Chemistry"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
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
              onChange={(e) => setCustomCategory(e.target.value)}
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
