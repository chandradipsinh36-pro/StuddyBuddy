import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { SUBJECTS, CATEGORIES, ROUTES } from '../../constants';
import toast from 'react-hot-toast';
import styles from './TutorResourceCreatePage.module.css';

export function TutorResourceEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('299');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        if (!id) return;
        const r = await resourceService.getResource(Number(id));
        setTitle(r.title || r.filename || '');
        setDescription(r.description || '');
        setSubject(r.subject || 'General');
        setCategory(r.category || 'General');
        setPrice(String(r.price || 0));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await resourceService.updateResource(Number(id), {
        title,
        description,
        subject,
        category,
        price: parseFloat(price),
      });
      toast.success('Resource details updated successfully!');
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
        <p className={styles.subtitle}>Update resource metadata, pricing, or description.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSave} className={styles.form}>
          <Input
            label="Resource Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />

          <div className={styles.row}>
            <Select
              label="Subject Discipline"
              options={SUBJECTS.map(s => ({ value: s, label: s }))}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Select
              label="Content Category"
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <Input
            label="Price (INR ₹)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

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
