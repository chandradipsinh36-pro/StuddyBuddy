import { useState } from 'react';
import { Flame, Save, BookOpen, Clock, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Badge } from '../../components/ui/Badge/Badge';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Button } from '../../components/ui/Button/Button';
import { SUBJECTS } from '../../constants';
import toast from 'react-hot-toast';
import styles from './StudentProfilePage.module.css';

export function StudentProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || 'Alex Johnson');
  const [bio, setBio] = useState('High school senior aiming for Computer Science & Mathematics in college. Love solving coding challenges and calculus problems!');
  const [goal, setGoal] = useState('Ace JEE Advanced & AP Calculus BC');
  const [interests, setInterests] = useState<string[]>(['Mathematics', 'Computer Science', 'Physics']);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (subject: string) => {
    setInterests(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Profile updated successfully!');
    }, 600);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Student Profile</h1>
        <p className={styles.subtitle}>Manage your learning goals, target exams, and study preferences.</p>
      </div>

      <div className={styles.layout}>
        {/* Left Column: Overview */}
        <div className={styles.card}>
          <div className={styles.userOverview}>
            <Avatar src={user?.avatarUrl || user?.profilePic || undefined} name={name} size="xl" />
            <div>
              <h2 className={styles.name}>{name}</h2>
              <p className={styles.email}>{user?.email || 'alex@example.com'}</p>
            </div>
            <div className={styles.streakBadge}>
              <Flame size={16} />
              <span>7 Days Learning Streak</span>
            </div>
            <Badge variant="primary">Verified Student</Badge>
          </div>

          <div className={styles.statsList}>
            <div className={styles.statRow}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="var(--color-primary-500)" /> Study Time
              </span>
              <span className={styles.statVal}>48 hours</span>
            </div>
            <div className={styles.statRow}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} color="var(--color-success)" /> Modules Finished
              </span>
              <span className={styles.statVal}>24 resources</span>
            </div>
            <div className={styles.statRow}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} color="#f59e0b" /> Quizzes Passed
              </span>
              <span className={styles.statVal}>18 / 20</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className={styles.card}>
          <form onSubmit={handleSave} className={styles.form}>
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Primary Learning Goal / Target Exam"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. SAT, JEE, AP Physics, Web Development"
            />

            <Textarea
              label="About Me & Learning Interests"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />

            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)' }}>
                Target Subjects (Click to toggle)
              </label>
              <div className={styles.interestGrid}>
                {SUBJECTS.map(sub => {
                  const active = interests.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      className={`${styles.interestTag} ${active ? styles.interestTagActive : ''}`}
                      onClick={() => toggleInterest(sub)}
                    >
                      {active ? '✓ ' : '+ '} {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Save size={16} />}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
