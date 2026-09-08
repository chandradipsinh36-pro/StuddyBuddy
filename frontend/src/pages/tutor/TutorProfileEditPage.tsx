import { useState, useEffect } from 'react';
import { Save, Award, Video, Briefcase } from 'lucide-react';
import { tutorService } from '../../services/tutorService';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Button } from '../../components/ui/Button/Button';
import { SUBJECTS } from '../../constants';
import toast from 'react-hot-toast';
import styles from './TutorProfileEditPage.module.css';

export function TutorProfileEditPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('10');
  const [trialVideoUrl, setTrialVideoUrl] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const t = await tutorService.getMyProfile();
        if (t) {
          setName(t.name || user?.name || '');
          setBio(t.bio || '');
          setExperience(String(t.experienceYears ?? t.experience ?? 5));
          setTrialVideoUrl(typeof t.trialVideo === 'object' ? (t.trialVideo as any)?.videoUrl : (t.trialVideo || 'https://www.youtube.com/watch?v=sample'));
          setSubjects(t.subjects || ['Mathematics']);
          if (Array.isArray(t.skills)) {
            setSkills(t.skills.map((s: any) => s.skillName || s.name || String(s)).join(', '));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const toggleSubject = (s: string) => {
    setSubjects(prev =>
      prev.includes(s)
        ? prev.length > 1 ? prev.filter(x => x !== s) : prev
        : [...prev, s]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tutorService.updateProfile({
        name,
        bio,
        experience: parseInt(experience, 10) || 5,
        subjects,
      });
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

      <div className={styles.card}>
        <form onSubmit={handleSave} className={styles.form}>
          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Textarea
            label="Instructor Biography & Teaching Philosophy"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            required
          />

          <div className={styles.row}>
            <Input
              label="Years of Teaching Experience"
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              leftIcon={<Briefcase size={16} />}
            />

            <Input
              label="Demo / Trial Video URL"
              type="url"
              value={trialVideoUrl}
              onChange={(e) => setTrialVideoUrl(e.target.value)}
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
              Primary Subjects Taught (Click to select)
            </label>
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
