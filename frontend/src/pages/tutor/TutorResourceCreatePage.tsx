import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { ProgressBar } from '../../components/ui/ProgressBar/ProgressBar';
import { SUBJECTS, CATEGORIES, RESOURCE_TYPES, DIFFICULTY_LEVELS, ROUTES } from '../../constants';
import toast from 'react-hot-toast';
import styles from './TutorResourceCreatePage.module.css';

export function TutorResourceCreatePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState('pdf');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [accessType, setAccessType] = useState('free');
  const [price, setPrice] = useState('199');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title.');
      return;
    }
    if (!file && type !== 'youtube') {
      toast.error('Please attach the file for this resource.');
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
      fd.append('title', title);
      fd.append('description', description);
      fd.append('subject', subject);
      fd.append('category', category);
      fd.append('type', type);
      fd.append('difficulty', difficulty);
      fd.append('accessType', accessType);
      if (accessType === 'premium') fd.append('price', price);
      if (file) fd.append('file', file);

      await resourceService.createResource(fd);
      setUploadProgress(100);
      clearInterval(interval);
      toast.success('Resource submitted for processing and safety validation!');
      navigate(ROUTES.TUTOR_RESOURCES);
    } catch {
      toast.error('Failed to upload resource. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to={ROUTES.TUTOR_RESOURCES} className={styles.backLink}>
        <ArrowLeft size={16} /> Back to My Resources
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Upload Teaching Material</h1>
        <p className={styles.subtitle}>
          Share quality educational notes, tests, or worksheets with students worldwide.
        </p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
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
            <Select
              label="Subject Discipline *"
              options={SUBJECTS.map(s => ({ value: s, label: s }))}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Select
              label="Content Category *"
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                helper="You earn 85% of this price on every student purchase"
                required
              />
            )}
          </div>

          <Input
            label="Search Tags (Comma separated)"
            placeholder="e.g. calculus, derivatives, engineering math"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          {/* File Upload Dropzone */}
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)', marginBottom: 'var(--space-2)', display: 'block' }}>
              Resource File Attachment *
            </label>
            <input
              ref={fileInputRef}
              type="file"
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
                    Supports PDF, PPT, Word, Audio, or Images up to 50MB
                  </span>
                </>
              )}
            </div>
          </div>

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
