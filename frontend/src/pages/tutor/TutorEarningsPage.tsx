import { useState, useEffect } from 'react';
import { CreditCard, DollarSign } from 'lucide-react';
import { earningsService } from '../../services/earningsService';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Modal } from '../../components/ui/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import type { EarningsSummary, EarningRecord } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorEarningsPage.module.css';

export function TutorEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [accountDetails, setAccountDetails] = useState('');

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const [s, t] = await Promise.all([
          earningsService.getSummary(),
          earningsService.getTransactions(),
        ]);
        setSummary(s);
        setTransactions(t);
        setPayoutAmount(String(s.currentBalance));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    const currBal = summary?.currentBalance ?? summary?.availableBalance ?? 0;
    if (isNaN(amt) || amt <= 0 || amt > currBal) {
      toast.error('Invalid payout amount.');
      return;
    }
    if (!accountDetails) {
      toast.error('Please enter payment recipient details.');
      return;
    }

    toast.success(`Payout request of ₹${amt.toLocaleString()} submitted! Funds will arrive in 2 business days.`);
    setPayoutModalOpen(false);
    if (summary) {
      setSummary({
        ...summary,
        currentBalance: currBal - amt,
        pendingEarnings: (summary.pendingEarnings ?? summary.pendingPayout ?? 0) + amt,
      });
    }
  };

  if (loading || !summary) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading earnings...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Instructor Earnings & Payouts</h1>
          <p className={styles.subtitle}>
            Transparent revenue splits (85% to instructor, 15% platform fee) and automated settlements.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<DollarSign size={16} />}
          onClick={() => setPayoutModalOpen(true)}
        >
          Request Payout
        </Button>
      </div>

      {/* Cards */}
      <div className={styles.cardsGrid}>
        <div className={`${styles.statCard} ${styles.statCardPrimary}`}>
          <div className={`${styles.cardLabel} ${styles.cardLabelLight}`}>Available for Withdrawal</div>
          <div className={`${styles.cardVal} ${styles.cardValLight}`}>₹{(summary.currentBalance ?? summary.availableBalance ?? 0).toLocaleString()}</div>
          <div className={`${styles.cardSub} ${styles.cardSubLight}`}>Ready to transfer</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardLabel}>Pending Clearance</div>
          <div className={styles.cardVal}>₹{(summary.pendingEarnings ?? summary.pendingPayout ?? 0).toLocaleString()}</div>
          <div className={`${styles.cardSub}`}>Clears within 48 hours</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardLabel}>This Month's Earnings</div>
          <div className={styles.cardVal}>₹{(summary.thisMonthEarnings ?? 0).toLocaleString()}</div>
          <div className={styles.cardSub}>Compared to ₹{(summary.lastMonthEarnings ?? 0).toLocaleString()} last month</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardLabel}>Lifetime Net Earnings</div>
          <div className={styles.cardVal}>₹{(summary.totalEarnings ?? summary.totalEarned ?? 0).toLocaleString()}</div>
          <div className={styles.cardSub}>Total gross ₹{Math.round((summary.totalEarnings ?? summary.totalEarned ?? 0) / 0.85).toLocaleString()}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Settlement Ledger</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Badge variant="outline">Last 30 Days</Badge>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Resource / Item</th>
              <th>Purchased By</th>
              <th>Date</th>
              <th>Gross Amount</th>
              <th>Platform Fee (15%)</th>
              <th>Net Payout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => {
              const resTitle = typeof t.resource === 'string' ? t.resource : (t.resource?.title || t.resource?.name || t.resourceTitle || 'Course Resource');
              const txDate = t.createdAt || t.date || new Date().toISOString();
              return (
                <tr key={t.id}>
                  <td><strong>{resTitle}</strong></td>
                  <td>{t.buyerName || 'Student'}</td>
                  <td>{new Date(txDate).toLocaleDateString()}</td>
                  <td>₹{t.grossAmount ?? t.amount ?? 0}</td>
                  <td style={{ color: 'var(--color-gray-500)' }}>-₹{t.platformFee ?? 0}</td>
                  <td><strong style={{ color: 'var(--color-success)' }}>+₹{t.netAmount ?? t.amount ?? 0}</strong></td>
                  <td>
                    <Badge variant={t.status === 'completed' || t.status === 'settled' ? 'success' : 'warning'}>
                      {t.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payout Request Modal */}
      <Modal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        title="Withdraw Funds"
      >
        <form onSubmit={handleRequestPayout} className={styles.payoutForm}>
          <Input
            label="Withdrawal Amount (₹)"
            type="number"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            helper={`Maximum available: ₹${(summary.currentBalance ?? summary.availableBalance ?? 0).toLocaleString()}`}
            required
          />

          <Select
            label="Payout Method"
            options={[
              { value: 'bank', label: 'Direct Bank Transfer (NEFT/IMPS)' },
              { value: 'upi', label: 'UPI ID (VPA)' },
              { value: 'paypal', label: 'PayPal Account' },
            ]}
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value)}
          />

          <Input
            label={payoutMethod === 'upi' ? 'UPI ID' : payoutMethod === 'paypal' ? 'PayPal Email' : 'Bank Account & IFSC'}
            placeholder={payoutMethod === 'upi' ? 'tutor@upi' : payoutMethod === 'paypal' ? 'tutor@example.com' : 'A/C 1234567890, IFSC HDFC0001234'}
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" type="button" onClick={() => setPayoutModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" leftIcon={<CreditCard size={16} />}>
              Confirm Payout
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
