import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, BookOpen, Package, Layers } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { enrollmentService } from '../../services/enrollmentService';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Modal } from '../../components/ui/Modal/Modal';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import type { Payment, Enrollment, Bundle } from '../../types';
import toast from 'react-hot-toast';
import styles from './StudentPurchasesPage.module.css';

export function StudentPurchasesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [purchasedBundles, setPurchasedBundles] = useState<Bundle[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'enrollments' | 'bundles'>('payments');
  const [loading, setLoading] = useState(true);

  // Refund modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, eRes, bRes] = await Promise.allSettled([
        paymentService.getMyPayments(),
        enrollmentService.getMyEnrollments(),
        paymentService.getMyPurchasedBundles(),
      ]);

      if (pRes.status === 'fulfilled') setPayments(pRes.value || []);
      if (eRes.status === 'fulfilled') setEnrollments(eRes.value || []);
      if (bRes.status === 'fulfilled') setPurchasedBundles(bRes.value || []);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenRefund = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
    setRefundReason('');
    setRefundModalOpen(true);
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId || !refundReason.trim()) {
      toast.error('Please enter a reason for the refund request.');
      return;
    }

    setSubmittingRefund(true);
    try {
      await paymentService.createRefund(selectedPaymentId, refundReason.trim());
      toast.success('Refund request submitted for admin review.');
      setRefundModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to submit refund request.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Purchases & Enrolled Courses</h1>
        <p className={styles.subtitle}>
          Manage your course enrollments, study bundles, and verified transaction receipts.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: activeTab === 'payments' ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
            color: activeTab === 'payments' ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
            borderBottom: activeTab === 'payments' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Payment History ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('enrollments')}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: activeTab === 'enrollments' ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
            color: activeTab === 'enrollments' ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
            borderBottom: activeTab === 'enrollments' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Enrolled Courses ({enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab('bundles')}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: activeTab === 'bundles' ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
            color: activeTab === 'bundles' ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
            borderBottom: activeTab === 'bundles' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          My Study Bundles ({purchasedBundles.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-gray-500)' }}>
          Loading your purchases...
        </div>
      ) : activeTab === 'payments' ? (
        payments.length === 0 ? (
          <EmptyState
            title="No purchases yet"
            description="You haven't enrolled in any courses or purchased study bundles yet."
            action={{
              label: 'Browse Courses',
              onClick: () => { window.location.href = '/courses'; },
            }}
          />
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item Unlocked</th>
                  <th>Reference ID</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const itemName = p.course?.title || p.bundle?.title || p.resource?.filename || `Payment #${p.paymentId}`;
                  const isCourse = Boolean(p.courseId);
                  const isBundle = Boolean(p.bundleId);
                  const refId = p.transactionRef || `TXN-SB-${p.paymentId}`;
                  const method = p.paymentMethod || (Number(p.amount) === 0 ? 'Free Voucher' : 'UPI/Card');

                  return (
                    <tr key={p.paymentId}>
                      <td>
                        <div className={styles.resourceCell}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isCourse && <BookOpen size={14} color="#2563eb" />}
                            {isBundle && <Package size={14} color="#7c3aed" />}
                            <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-900)' }}>
                              {itemName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: 'var(--font-size-xs)', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                          {refId}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', fontWeight: 500 }}>
                          {method}
                        </span>
                      </td>
                      <td>{new Date(p.paidAt).toLocaleDateString()}</td>
                      <td><strong>₹{Number(p.amount).toLocaleString('en-IN')}</strong></td>
                      <td>
                        <Badge variant={p.status === 'success' ? 'success' : p.status === 'refunded' ? 'error' : 'warning'}>
                          {p.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                          {p.status === 'success' && Number(p.amount) > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRefund(p.paymentId)}
                            >
                              Request Refund
                            </Button>
                          )}
                          {p.courseId && (
                            <Link to={`/courses/${p.courseId}`}>
                              <Button variant="primary" size="sm" rightIcon={<ExternalLink size={14} />}>
                                View Course
                              </Button>
                            </Link>
                          )}
                          {p.bundleId && (
                            <Link to={`/bundles/${p.bundleId}`}>
                              <Button variant="primary" size="sm" rightIcon={<ExternalLink size={14} />}>
                                View Bundle
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === 'enrollments' ? (
        /* Enrollments Tab */
        enrollments.length === 0 ? (
          <EmptyState
            title="No course enrollments"
            description="Explore our course catalog and enroll in courses taught by top verified tutors."
            action={{
              label: 'Browse Courses',
              onClick: () => { window.location.href = '/courses'; },
            }}
          />
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Enrolled On</th>
                  <th>Enrolled Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr) => (
                  <tr key={enr.enrollmentId}>
                    <td>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-900)' }}>
                        {enr.course?.title || `Course #${enr.courseId}`}
                      </div>
                    </td>
                    <td>{new Date(enr.enrolledAt).toLocaleDateString()}</td>
                    <td><strong>₹{Number(enr.priceAtEnrollment).toLocaleString('en-IN')}</strong></td>
                    <td>
                      <Badge variant={enr.status === 'active' ? 'success' : 'warning'}>
                        {enr.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/courses/${enr.courseId}`}>
                        <Button variant="primary" size="sm" leftIcon={<BookOpen size={14} />}>
                          Go to Course
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Study Bundles Tab */
        purchasedBundles.length === 0 ? (
          <EmptyState
            title="No study bundles purchased"
            description="Explore curated learning packs assembled by top instructors with complete study notes."
            action={{
              label: 'Explore Study Bundles',
              onClick: () => { window.location.href = '/bundles'; },
            }}
          />
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bundle Package</th>
                  <th>Author / Tutor</th>
                  <th>Materials Count</th>
                  <th>Price Paid</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchasedBundles.map((b: any) => {
                  const bId = b.bundleId || b.id;
                  const title = b.title || b.name || 'Study Bundle';
                  const tutor = b.tutor?.name || 'Verified Tutor';
                  const itemCount = b.bundleItems?.length || b.resources?.length || 0;
                  const pricePaid = b.paidAmount !== undefined ? Number(b.paidAmount) : Number(b.price || 0);

                  return (
                    <tr key={bId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Package size={16} color="#7c3aed" />
                          <div>
                            <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-900)' }}>
                              {title}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                              {b.description ? `${b.description.slice(0, 60)}...` : 'Comprehensive learning bundle'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{tutor}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)' }}>
                          <Layers size={13} color="var(--color-primary-600)" /> {itemCount} Materials Included
                        </span>
                      </td>
                      <td>
                        <strong>{pricePaid === 0 ? 'Free' : `₹${pricePaid.toLocaleString('en-IN')}`}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/bundles/${bId}`}>
                          <Button variant="primary" size="sm" rightIcon={<ExternalLink size={14} />}>
                            Open Bundle
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Refund Modal */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Request Payment Refund"
      >
        <form onSubmit={handleRequestRefund} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', margin: 0 }}>
            StudyBuddy provides full refunds in accordance with our guarantee policy. Please tell us why you are requesting a refund.
          </p>

          <Textarea
            label="Reason for Refund *"
            placeholder="e.g. Course content does not match the description..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            rows={4}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="ghost" type="button" onClick={() => setRefundModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submittingRefund}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

