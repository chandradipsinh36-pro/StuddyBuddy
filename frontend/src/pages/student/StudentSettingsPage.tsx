import { useState } from 'react';
import { Bell, Lock, ShieldAlert, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import toast from 'react-hot-toast';
import styles from './StudentSettingsPage.module.css';

export function StudentSettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [groupUpdates, setGroupUpdates] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveNotifs = () => {
    toast.success('Notification preferences updated!');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    toast.success('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Account Settings</h1>
        <p className={styles.subtitle}>Manage your notifications, security, and account preferences.</p>
      </div>

      {/* Notifications Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Bell size={18} color="var(--color-primary-600)" />
          Notification Preferences
        </h2>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Email notifications for new tutor resources</div>
            <div className={styles.toggleDesc}>Receive an alert when tutors you follow post new content</div>
          </div>
          <input
            type="checkbox"
            checked={emailNotifs}
            onChange={(e) => setEmailNotifs(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Daily study reminders</div>
            <div className={styles.toggleDesc}>Gentle reminder to keep up your 7-day study streak</div>
          </div>
          <input
            type="checkbox"
            checked={reminders}
            onChange={(e) => setReminders(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Study group message digests</div>
            <div className={styles.toggleDesc}>Receive activity summaries from joined study groups</div>
          </div>
          <input
            type="checkbox"
            checked={groupUpdates}
            onChange={(e) => setGroupUpdates(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
        </div>

        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={handleSaveNotifs} leftIcon={<Save size={14} />}>
            Save Preferences
          </Button>
        </div>
      </div>

      {/* Password & Security */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Lock size={18} color="var(--color-primary-600)" />
          Change Password
        </h2>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" size="sm" type="submit">
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className={`${styles.section} ${styles.dangerSection}`}>
        <h2 className={styles.sectionTitle} style={{ color: 'var(--color-error)' }}>
          <ShieldAlert size={18} color="var(--color-error)" />
          Danger Zone
        </h2>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
          Deleting your account is permanent. All course progress, bookmarks, and purchases will be irrecoverable.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm('Are you sure you want to deactivate your StudyBuddy account?')) {
              toast.success('Account deactivation requested.');
            }
          }}
        >
          Deactivate Account
        </Button>
      </div>
    </div>
  );
}
