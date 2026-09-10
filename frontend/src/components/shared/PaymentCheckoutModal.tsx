import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ShieldCheck, CheckCircle2, Lock, Smartphone, CreditCard,
  Building2, Wallet, Tag, Copy, Check, Sparkles, BookOpen, Package,
  ExternalLink, QrCode
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar/Avatar';
import toast from 'react-hot-toast';
import styles from './PaymentCheckoutModal.module.css';

export interface CheckoutItem {
  type: 'course' | 'bundle';
  id: number;
  title: string;
  price: number;
  originalPrice?: number;
  tutorName?: string;
  tutorAvatar?: string;
  description?: string;
  itemCount?: number;
}

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CheckoutItem | null;
  onSuccess: (result: {
    payment: any;
    transactionRef: string;
    paymentMethod: string;
    amount: number;
    enrollment?: any;
  }) => void;
}

type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet';

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Payment method tab
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi');

  // UPI Form state
  const [upiOption, setUpiOption] = useState<'apps' | 'id' | 'qr'>('apps');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');
  const [upiId, setUpiId] = useState('');

  // Card Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState('paytm');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    message: string;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Processing & Success states
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
  const [successData, setSuccessData] = useState<{
    transactionRef: string;
    amount: number;
    paymentMethod: string;
    paidAt: string;
    title: string;
  } | null>(null);

  const [copiedRef, setCopiedRef] = useState(false);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setProcessing(false);
      setProcessingStep(1);
      setSuccessData(null);
      setCouponCode('');
      setAppliedCoupon(null);
      setCopiedRef(false);
      if (user?.name) {
        setCardName(user.name);
      }
    }
  }, [isOpen, user?.name]);

  if (!isOpen || !item) return null;

  const basePrice = Number(item.price || 0);
  const origPrice = Number(item.originalPrice || (basePrice > 0 ? Math.round(basePrice / 0.8) : 0));
  const baseDiscount = origPrice > basePrice ? origPrice - basePrice : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalPrice = Math.max(0, basePrice - couponDiscount);
  const isFree = finalPrice === 0;

  // Format Card Number (4-4-4-4)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Detect card network
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^60|^65|^8[1-2]/.test(clean)) return 'RuPay';
    if (/^3[47]/.test(clean)) return 'Amex';
    return null;
  };

  // Apply Coupon
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await paymentService.validateCoupon(code, basePrice);
      setAppliedCoupon({
        code: res.couponCode,
        discount: res.discount,
        message: res.message,
      });
      setCouponCode(res.couponCode);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast('Coupon removed', { icon: 'ℹ️' });
  };

  // Complete Payment Action
  const handleProcessPayment = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to complete your enrollment');
      navigate('/login');
      return;
    }

    if (user?.role !== 'student') {
      toast.error('Only student accounts can enroll in courses or buy study bundles');
      return;
    }

    // Validation for non-free orders
    let chosenMethod = 'free';
    let transactionRef = `TXN-SB-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!isFree) {
      chosenMethod = selectedMethod;
      if (selectedMethod === 'upi') {
        if (upiOption === 'id' && (!upiId.trim() || !upiId.includes('@'))) {
          toast.error('Please enter a valid UPI ID (e.g. username@okhdfcbank)');
          return;
        }
        chosenMethod = upiOption === 'apps' ? `UPI (${selectedUpiApp.toUpperCase()})` : `UPI (${upiId || 'QR'})`;
      } else if (selectedMethod === 'card') {
        const cleanCard = cardNumber.replace(/\s/g, '');
        if (cleanCard.length < 15) {
          toast.error('Please enter a valid 16-digit card number');
          return;
        }
        if (!cardExpiry || cardExpiry.length < 5) {
          toast.error('Please enter card expiry in MM/YY format');
          return;
        }
        if (!cardCvv || cardCvv.length < 3) {
          toast.error('Please enter a valid 3-digit CVV');
          return;
        }
        const brand = getCardBrand(cardNumber) || 'Card';
        chosenMethod = `${brand} (•••• ${cleanCard.slice(-4)})`;
      } else if (selectedMethod === 'netbanking') {
        chosenMethod = `Net Banking (${selectedBank})`;
      } else if (selectedMethod === 'wallet') {
        chosenMethod = `Wallet (${selectedWallet.toUpperCase()})`;
      }
    }

    setProcessing(true);
    setProcessingStep(1);

    try {
      // Realistic security verification sequence
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep(2);
      await new Promise((r) => setTimeout(r, 650));
      setProcessingStep(3);

      let result: any;
      if (item.type === 'course') {
        result = await paymentService.payCourse({
          courseId: item.id,
          amount: finalPrice,
          paymentMethod: chosenMethod,
          transactionRef,
          couponCode: appliedCoupon?.code,
        });
      } else {
        result = await paymentService.payBundle({
          bundleId: item.id,
          amount: finalPrice,
          paymentMethod: chosenMethod,
          transactionRef,
          couponCode: appliedCoupon?.code,
        });
      }

      const confirmedRef = result.transactionRef || transactionRef;
      setSuccessData({
        transactionRef: confirmedRef,
        amount: finalPrice,
        paymentMethod: chosenMethod,
        paidAt: new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        title: item.title,
      });

      toast.success(
        item.type === 'course'
          ? 'Course enrollment confirmed!'
          : 'Study bundle unlocked!'
      );

      onSuccess({
        payment: result.payment,
        transactionRef: confirmedRef,
        paymentMethod: chosenMethod,
        amount: finalPrice,
        enrollment: result.enrollment,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Payment could not be completed. Please try again.';
      toast.error(msg);
      setProcessing(false);
      setProcessingStep(1);
    }
  };

  const copyRefToClipboard = () => {
    if (successData?.transactionRef) {
      navigator.clipboard.writeText(successData.transactionRef);
      setCopiedRef(true);
      toast.success('Transaction ID copied to clipboard');
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleFinish = () => {
    onClose();
    if (item.type === 'course') {
      navigate(`/courses/${item.id}`);
    } else {
      navigate(`/bundles/${item.id}`);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <Lock size={18} />
            </div>
            <div>
              <h2 className={styles.headerTitle}>
                {successData ? 'Payment Confirmed' : 'Secure Checkout'}
              </h2>
              <div className={styles.headerSubtitle}>
                {successData
                  ? 'Your transaction was verified and completed successfully'
                  : 'Fast 256-bit encrypted enrollment'}
              </div>
            </div>
          </div>
          {!processing && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Processing State */}
        {processing && !successData && (
          <div className={styles.processingView}>
            <div className={styles.spinner} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0' }}>
              Securing Your Enrollment...
            </h3>
            <div className={styles.processingSteps}>
              <div className={styles.processingStepActive}>
                <ShieldCheck size={16} /> 1. Encrypting payment session
              </div>
              <div className={processingStep >= 2 ? styles.processingStepActive : undefined}>
                <CheckCircle2 size={16} /> 2. Authorizing with banking network
              </div>
              <div className={processingStep >= 3 ? styles.processingStepActive : undefined}>
                <Sparkles size={16} /> 3. Granting instant access to learning materials
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              Please do not refresh or close this window.
            </p>
          </div>
        )}

        {/* Success / Official Receipt Screen */}
        {successData && (
          <div className={styles.successView}>
            <div className={styles.successIconBadge}>
              <Check size={36} strokeWidth={3} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Enrollment Successful!
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                You now have full, unrestricted access to{' '}
                <strong style={{ color: '#0f172a' }}>{successData.title}</strong>.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className={styles.receiptCard}>
              <div className={styles.receiptRow}>
                <span>Transaction Reference</span>
                <button
                  type="button"
                  className={styles.receiptRefValue}
                  onClick={copyRefToClipboard}
                  title="Click to copy reference ID"
                >
                  <span>{successData.transactionRef}</span>
                  {copiedRef ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                </button>
              </div>

              <div className={styles.receiptRow}>
                <span>Payment Method</span>
                <strong style={{ color: '#0f172a' }}>{successData.paymentMethod}</strong>
              </div>

              <div className={styles.receiptRow}>
                <span>Date & Time</span>
                <span>{successData.paidAt}</span>
              </div>

              <div className={styles.receiptRow} style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Amount Paid</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: successData.amount === 0 ? '#10b981' : '#2563eb' }}>
                  {successData.amount === 0 ? 'Free Access' : `₹${successData.amount.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.primarySuccessBtn}
                onClick={handleFinish}
              >
                <span>{item.type === 'course' ? 'Start Learning Now' : 'Explore Bundle Materials'}</span>
                <ExternalLink size={16} />
              </button>
              <button
                type="button"
                className={styles.secondarySuccessBtn}
                onClick={() => {
                  onClose();
                  navigate('/purchases');
                }}
              >
                View in Purchases
              </button>
            </div>
          </div>
        )}

        {/* Standard Checkout Form */}
        {!processing && !successData && (
          <div className={styles.body}>
            {/* Left Column: Order Summary & Promo Code */}
            <div className={styles.summarySidebar}>
              <div className={styles.itemCard}>
                <span
                  className={`${styles.itemBadge} ${
                    item.type === 'course' ? styles.itemBadgeCourse : styles.itemBadgeBundle
                  }`}
                >
                  {item.type === 'course' ? <BookOpen size={12} /> : <Package size={12} />}
                  {item.type === 'course' ? 'Course Enrollment' : 'Study Bundle'}
                </span>

                <h4 className={styles.itemTitle}>{item.title}</h4>

                {item.tutorName && (
                  <div className={styles.itemTutor}>
                    <Avatar src={item.tutorAvatar} name={item.tutorName} size="xs" />
                    <span>By {item.tutorName}</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className={styles.priceRows}>
                {origPrice > basePrice && (
                  <div className={styles.priceRow}>
                    <span>Original Price</span>
                    <span style={{ textDecoration: 'line-through' }}>
                      ₹{origPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className={styles.priceRow}>
                  <span>Price</span>
                  <span>₹{basePrice.toLocaleString('en-IN')}</span>
                </div>

                {baseDiscount > 0 && (
                  <div className={styles.priceRow}>
                    <span className={styles.discountValue}>Package Savings</span>
                    <span className={styles.discountValue}>-₹{baseDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className={styles.priceRow}>
                    <span className={styles.discountValue}>
                      Promo ({appliedCoupon.code})
                    </span>
                    <span className={styles.discountValue}>
                      -₹{appliedCoupon.discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className={styles.priceRow}>
                  <span>Platform Fee</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>₹0 (Waived)</span>
                </div>

                <div className={styles.priceRowTotal}>
                  <span>Total Amount</span>
                  <span className={isFree ? styles.totalAmountFree : styles.totalAmount}>
                    {isFree ? 'Free' : `₹${finalPrice.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              {/* Promo Code Box */}
              <div className={styles.couponBox}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  Have a Coupon Code?
                </div>

                {appliedCoupon ? (
                  <div className={styles.couponActiveBadge}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag size={14} />
                      <span>{appliedCoupon.code} Applied</span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeCouponBtn}
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className={styles.couponInputRow}>
                    <input
                      type="text"
                      className={styles.couponInput}
                      placeholder="e.g. WELCOME20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleApplyCoupon();
                      }}
                    />
                    <button
                      type="button"
                      className={styles.couponBtn}
                      disabled={validatingCoupon || !couponCode.trim()}
                      onClick={() => handleApplyCoupon()}
                    >
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}

                {/* Quick Coupon Hints */}
                {!appliedCoupon && basePrice > 0 && (
                  <div className={styles.couponHints}>
                    <span>Try:</span>
                    <span className={styles.couponPill} onClick={() => handleApplyCoupon('WELCOME20')}>
                      WELCOME20 (20% OFF)
                    </span>
                    <span className={styles.couponPill} onClick={() => handleApplyCoupon('STUDYBUDDY')}>
                      STUDYBUDDY (₹100 OFF)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Payment Methods Form */}
            <div className={styles.paymentMain}>
              {/* If price is 0 (free course or 100% discount applied) */}
              {isFree ? (
                <div className={styles.freeBanner}>
                  <div className={styles.freeBadge}>
                    <Sparkles size={14} /> 100% Free Access
                  </div>
                  <h3 className={styles.freeTitle}>Ready for Immediate Enrollment</h3>
                  <p className={styles.freeText}>
                    No payment details required! Click below to complete enrollment and immediately start learning.
                  </p>
                  <button
                    type="button"
                    className={styles.freeSubmitBtn}
                    onClick={handleProcessPayment}
                  >
                    <CheckCircle2 size={18} />
                    <span>Complete Free Enrollment</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Payment Method Tabs */}
                  <div className={styles.tabsContainer}>
                    <button
                      type="button"
                      className={`${styles.tabBtn} ${selectedMethod === 'upi' ? styles.tabBtnActive : ''}`}
                      onClick={() => setSelectedMethod('upi')}
                    >
                      <Smartphone size={18} />
                      <span>UPI Fast</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.tabBtn} ${selectedMethod === 'card' ? styles.tabBtnActive : ''}`}
                      onClick={() => setSelectedMethod('card')}
                    >
                      <CreditCard size={18} />
                      <span>Card</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.tabBtn} ${selectedMethod === 'netbanking' ? styles.tabBtnActive : ''}`}
                      onClick={() => setSelectedMethod('netbanking')}
                    >
                      <Building2 size={18} />
                      <span>Net Banking</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.tabBtn} ${selectedMethod === 'wallet' ? styles.tabBtnActive : ''}`}
                      onClick={() => setSelectedMethod('wallet')}
                    >
                      <Wallet size={18} />
                      <span>Wallets</span>
                    </button>
                  </div>

                  {/* Tab 1: UPI */}
                  {selectedMethod === 'upi' && (
                    <div className={styles.tabContent}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className={`${styles.upiAppBtn} ${upiOption === 'apps' ? styles.upiAppBtnSelected : ''}`}
                          onClick={() => setUpiOption('apps')}
                        >
                          UPI Apps
                        </button>
                        <button
                          type="button"
                          className={`${styles.upiAppBtn} ${upiOption === 'id' ? styles.upiAppBtnSelected : ''}`}
                          onClick={() => setUpiOption('id')}
                        >
                          Enter UPI ID
                        </button>
                        <button
                          type="button"
                          className={`${styles.upiAppBtn} ${upiOption === 'qr' ? styles.upiAppBtnSelected : ''}`}
                          onClick={() => setUpiOption('qr')}
                        >
                          <QrCode size={14} /> Scan QR
                        </button>
                      </div>

                      {upiOption === 'apps' && (
                        <div className={styles.upiAppGrid}>
                          <button
                            type="button"
                            className={`${styles.upiAppBtn} ${selectedUpiApp === 'gpay' ? styles.upiAppBtnSelected : ''}`}
                            onClick={() => setSelectedUpiApp('gpay')}
                          >
                            <span>Google Pay</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.upiAppBtn} ${selectedUpiApp === 'phonepe' ? styles.upiAppBtnSelected : ''}`}
                            onClick={() => setSelectedUpiApp('phonepe')}
                          >
                            <span>PhonePe</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.upiAppBtn} ${selectedUpiApp === 'paytm' ? styles.upiAppBtnSelected : ''}`}
                            onClick={() => setSelectedUpiApp('paytm')}
                          >
                            <span>Paytm UPI</span>
                          </button>
                        </div>
                      )}

                      {upiOption === 'id' && (
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Enter UPI ID / VPA</label>
                          <input
                            type="text"
                            className={styles.textInput}
                            placeholder="e.g. yourname@okhdfcbank"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                          />
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            A payment request will be sent to your UPI app for authorization.
                          </span>
                        </div>
                      )}

                      {upiOption === 'qr' && (
                        <div className={styles.qrContainer}>
                          <div className={styles.qrBox}>
                            {/* Simulated SVG QR Code */}
                            <svg width="130" height="130" viewBox="0 0 100 100">
                              <rect width="100" height="100" fill="#ffffff" />
                              <rect x="5" y="5" width="26" height="26" fill="#0f172a" />
                              <rect x="9" y="9" width="18" height="18" fill="#ffffff" />
                              <rect x="13" y="13" width="10" height="10" fill="#0f172a" />
                              <rect x="69" y="5" width="26" height="26" fill="#0f172a" />
                              <rect x="73" y="9" width="18" height="18" fill="#ffffff" />
                              <rect x="77" y="13" width="10" height="10" fill="#0f172a" />
                              <rect x="5" y="69" width="26" height="26" fill="#0f172a" />
                              <rect x="9" y="73" width="18" height="18" fill="#ffffff" />
                              <rect x="13" y="77" width="10" height="10" fill="#0f172a" />
                              {/* QR dots */}
                              <rect x="40" y="10" width="8" height="8" fill="#0f172a" />
                              <rect x="52" y="15" width="6" height="6" fill="#0f172a" />
                              <rect x="42" y="25" width="10" height="6" fill="#0f172a" />
                              <rect x="10" y="42" width="6" height="10" fill="#0f172a" />
                              <rect x="22" y="46" width="8" height="8" fill="#0f172a" />
                              <rect x="40" y="42" width="18" height="18" fill="#0f172a" />
                              <rect x="46" y="48" width="6" height="6" fill="#ffffff" />
                              <rect x="66" y="42" width="10" height="8" fill="#0f172a" />
                              <rect x="82" y="48" width="8" height="8" fill="#0f172a" />
                              <rect x="42" y="68" width="12" height="6" fill="#0f172a" />
                              <rect x="60" y="70" width="8" height="12" fill="#0f172a" />
                              <rect x="75" y="72" width="14" height="6" fill="#0f172a" />
                              <rect x="44" y="82" width="14" height="8" fill="#0f172a" />
                              <rect x="70" y="85" width="12" height="8" fill="#0f172a" />
                            </svg>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                            Scan & Pay ₹{finalPrice.toLocaleString('en-IN')} with any UPI app
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Card */}
                  {selectedMethod === 'card' && (
                    <div className={styles.tabContent}>
                      <div className={styles.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className={styles.inputLabel}>Card Number</label>
                          <div className={styles.cardBrands}>
                            <span className={styles.brandTag}>Visa</span>
                            <span className={styles.brandTag}>Mastercard</span>
                            <span className={styles.brandTag}>RuPay</span>
                          </div>
                        </div>
                        <input
                          type="text"
                          className={styles.textInput}
                          placeholder="4111 2222 3333 4444"
                          maxLength={19}
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Cardholder Name</label>
                        <input
                          type="text"
                          className={styles.textInput}
                          placeholder="e.g. Amit Sharma"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                      </div>

                      <div className={styles.cardGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Expires (MM/YY)</label>
                          <input
                            type="text"
                            className={styles.textInput}
                            placeholder="12/28"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>CVV / CVC</label>
                          <input
                            type="password"
                            className={styles.textInput}
                            placeholder="•••"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Net Banking */}
                  {selectedMethod === 'netbanking' && (
                    <div className={styles.tabContent}>
                      <div className={styles.inputLabel}>Select Popular Indian Bank</div>
                      <div className={styles.bankGrid}>
                        {['HDFC', 'SBI', 'ICICI', 'Axis Bank', 'Kotak', 'PNB'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            className={`${styles.bankTile} ${selectedBank === b ? styles.bankTileSelected : ''}`}
                            onClick={() => setSelectedBank(b)}
                          >
                            <Building2 size={16} />
                            <span>{b}</span>
                          </button>
                        ))}
                      </div>

                      <div className={styles.inputGroup} style={{ marginTop: 8 }}>
                        <label className={styles.inputLabel}>Or choose other banks</label>
                        <select
                          className={styles.textInput}
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                        >
                          <option value="HDFC">HDFC Bank</option>
                          <option value="SBI">State Bank of India (SBI)</option>
                          <option value="ICICI">ICICI Bank</option>
                          <option value="Axis Bank">Axis Bank</option>
                          <option value="Kotak">Kotak Mahindra Bank</option>
                          <option value="PNB">Punjab National Bank</option>
                          <option value="Bank of Baroda">Bank of Baroda</option>
                          <option value="Canara Bank">Canara Bank</option>
                          <option value="IndusInd Bank">IndusInd Bank</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Wallets */}
                  {selectedMethod === 'wallet' && (
                    <div className={styles.tabContent}>
                      <div className={styles.inputLabel}>Select Digital Wallet</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { id: 'paytm', name: 'Paytm Wallet' },
                          { id: 'phonepe', name: 'PhonePe Wallet' },
                          { id: 'amazonpay', name: 'Amazon Pay Balance' },
                        ].map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            className={`${styles.upiAppBtn} ${selectedWallet === w.id ? styles.upiAppBtnSelected : ''}`}
                            onClick={() => setSelectedWallet(w.id)}
                            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
                          >
                            <Wallet size={18} />
                            <span>{w.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pay Submit CTA */}
                  <button
                    type="button"
                    className={styles.paySubmitBtn}
                    onClick={handleProcessPayment}
                  >
                    <Lock size={16} />
                    <span>Pay ₹{finalPrice.toLocaleString('en-IN')} Securely</span>
                  </button>

                  <div className={styles.securityNote}>
                    <ShieldCheck size={14} color="#16a34a" />
                    <span>256-bit SSL Bank-Grade Encryption • Instant Unlock</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
