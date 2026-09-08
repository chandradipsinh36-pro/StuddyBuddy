import { useState } from 'react';
import { CreditCard, Bell, ShieldCheck, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import toast from 'react-hot-toast';
import styles from './TutorSettingsPage.module.css';

export function TutorSettingsPage() {
  const [bankName, setBankName] = useState('HDFC Bank Ltd.');
  const [accountNumber, setAccountNumber] = useState('50100234567890');
  const [ifsc, setIfsc] = useState('HDFC0001234');
  const [beneficiary, setBeneficiary] = useState('Dr. Sarah Chen');
  const [taxId, setTaxId] = useState('ABCDE1234F');

  const [saleAlerts, setSaleAlerts] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Payout & banking details securely saved.');
    }, 600);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Instructor Payout & Account Settings</h1>
        <p className={styles.subtitle}>
          Configure your payment settlement preferences and notification preferences.
        </p>
      </div>

      {/* Payout Bank Account */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <CreditCard size={18} color="var(--color-primary-600)" />
          Bank Account for Earnings Payouts
        </h2>

        <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirections: 'column', gap: 'var(--space-4)' } as any}>
          <div className={styles.row}>
            <Input
              label="Beneficiary / Account Holder Name"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              required
            />
            <Input
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
          </div>

          <div className={styles.row}>
            <Input
              label="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
            <Input
              label="IFSC / SWIFT Code"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value)}
              required
            />
          </div>

          <Input
            label="Tax Identification / PAN (For TDS compliance)"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            helper="Required for generating automated monthly tax statements."
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-2)' }}>
            <ShieldCheck size={16} color="var(--color-success)" />
            <span>Bank details are encrypted using 256-bit AES protocol.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <Button variant="primary" size="sm" type="submit" isLoading={saving} leftIcon={<Save size={14} />}>
              Save Banking Information
            </Button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Bell size={18} color="var(--color-primary-600)" />
          Instructor Alerts
        </h2>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Instant sale notifications</div>
            <div className={styles.toggleDesc}>Receive an instant email whenever a student buys your materials</div>
          </div>
          <input
            type="checkbox"
            checked={saleAlerts}
            onChange={(e) => setSaleAlerts(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Student review alerts</div>
            <div className={styles.toggleDesc}>Get notified when a learner leaves feedback or ratings</div>
          </div>
          <input
            type="checkbox"
            checked={reviewAlerts}
            onChange={(e) => setReviewAlerts(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Weekly earnings & payout summary</div>
            <div className={styles.toggleDesc}>Weekly financial statement sent to your registered email</div>
          </div>
          <input
            type="checkbox"
            checked={payoutAlerts}
            onChange={(e) => setPayoutAlerts(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
        </div>

        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={() => toast.success('Alert settings saved.')} leftIcon={<Save size={14} />}>
            Save Notification Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
