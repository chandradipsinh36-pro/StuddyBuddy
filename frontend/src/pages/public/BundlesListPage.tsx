import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, Package, X, Layers, FileText,
  Image as ImageIcon, Video, ShoppingBag, Sparkles, ArrowRight, Lock, Download
} from 'lucide-react';
import { bundleService } from '../../services/bundleService';
import { paymentService } from '../../services/paymentService';
import { BundleCard } from '../../components/shared/BundleCard';
import { PaymentCheckoutModal } from '../../components/shared/PaymentCheckoutModal';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import type { Bundle } from '../../types';
import toast from 'react-hot-toast';
import styles from './BundlesListPage.module.css';

type PriceFilter = 'all' | 'free' | 'under500' | 'premium';
type SortOption = 'newest' | 'priceAsc' | 'priceDesc' | 'items';

export const BundlesListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [purchasedBundleIds, setPurchasedBundleIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [checkoutBundle, setCheckoutBundle] = useState<Bundle | null>(null);

  useEffect(() => {
    async function loadBundles() {
      setLoading(true);
      try {
        const [data, myBundles] = await Promise.all([
          bundleService.getPublicBundles(),
          (isAuthenticated && user?.role === 'student')
            ? paymentService.getMyPurchasedBundles().catch(() => [])
            : Promise.resolve([]),
        ]);
        setBundles(data || []);
        if (myBundles && myBundles.length > 0) {
          const ids = new Set<number>(myBundles.map((b: any) => Number(b.bundleId || b.id)));
          setPurchasedBundleIds(ids);
        }
      } catch (err) {
        console.error('Failed to load bundles:', err);
        toast.error('Could not load bundles. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadBundles();
  }, [isAuthenticated, user?.role]);

  // Handle URL param /bundles/:id
  useEffect(() => {
    if (id && bundles.length > 0) {
      const match = bundles.find(b => String(b.id || b.bundleId) === id);
      if (match) {
        setSelectedBundle(match);
      } else {
        bundleService.getBundleById(Number(id)).then(setSelectedBundle).catch(() => {});
      }
    }
  }, [id, bundles]);

  const filteredBundles = useMemo(() => {
    return bundles
      .filter((b) => {
        const title = (b.name || b.title || '').toLowerCase();
        const desc = (b.description || '').toLowerCase();
        const tutor = (b.tutor?.name || '').toLowerCase();
        const q = search.toLowerCase().trim();
        const matchesQuery = !q || title.includes(q) || desc.includes(q) || tutor.includes(q);

        const price = Number(b.price || b.finalPrice || 0);
        let matchesPrice = true;
        if (priceFilter === 'free') matchesPrice = price === 0;
        else if (priceFilter === 'under500') matchesPrice = price > 0 && price <= 500;
        else if (priceFilter === 'premium') matchesPrice = price > 500;

        return matchesQuery && matchesPrice;
      })
      .sort((a, b) => {
        const priceA = Number(a.price || a.finalPrice || 0);
        const priceB = Number(b.price || b.finalPrice || 0);
        const itemsA = a.resources?.length || a.bundleItems?.length || 0;
        const itemsB = b.resources?.length || b.bundleItems?.length || 0;

        if (sortOption === 'priceAsc') return priceA - priceB;
        if (sortOption === 'priceDesc') return priceB - priceA;
        if (sortOption === 'items') return itemsB - itemsA;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [bundles, search, priceFilter, sortOption]);

  const handleCloseModal = () => {
    setSelectedBundle(null);
    if (id) {
      navigate('/bundles', { replace: true });
    }
  };

  const handleBuyBundle = (b: Bundle) => {
    if (!isAuthenticated) {
      toast('Please login to purchase or access study bundles', { icon: '🔒' });
      navigate('/login');
      return;
    }
    if (user?.role !== 'student') {
      toast.error('Only students can purchase study bundles');
      return;
    }
    setCheckoutBundle(b);
  };

  const getFileIcon = (fileType?: string) => {
    const t = (fileType || '').toLowerCase();
    if (t.includes('pdf')) return <FileText size={16} color="#dc2626" />;
    if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <ImageIcon size={16} color="#059669" />;
    if (t.includes('video') || t.includes('mp4')) return <Video size={16} color="#7c3aed" />;
    return <FileText size={16} color="#2563eb" />;
  };

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} /> Curated Learning Packs
          </div>
          <h1 className={styles.heroTitle}>Curated Study Bundles</h1>
          <p className={styles.heroSubtitle}>
            Save big with high-yield resource packages assembled by verified tutors.
            Get complete notes, problem sets, and practice materials in one click.
          </p>

          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search bundles by title, subject, or tutor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className={styles.mainContainer}>
        {/* Controls & Filter Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.filterPills}>
            <button
              className={`${styles.pillBtn} ${priceFilter === 'all' ? styles.pillActive : ''}`}
              onClick={() => setPriceFilter('all')}
            >
              All Bundles
            </button>
            <button
              className={`${styles.pillBtn} ${priceFilter === 'free' ? styles.pillActive : ''}`}
              onClick={() => setPriceFilter('free')}
            >
              Free
            </button>
            <button
              className={`${styles.pillBtn} ${priceFilter === 'under500' ? styles.pillActive : ''}`}
              onClick={() => setPriceFilter('under500')}
            >
              Under ₹500
            </button>
            <button
              className={`${styles.pillBtn} ${priceFilter === 'premium' ? styles.pillActive : ''}`}
              onClick={() => setPriceFilter('premium')}
            >
              Premium
            </button>
          </div>

          <div className={styles.sortGroup}>
            <span>Sort by:</span>
            <select
              className={styles.sortSelect}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
            >
              <option value="newest">Newest First</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="items">Most Resources</option>
            </select>
          </div>
        </div>

        {/* Bundles Grid */}
        {loading ? (
          <div className={styles.bundlesGrid}>
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredBundles.length === 0 ? (
          <EmptyState
            title="No study bundles found"
            description="Try adjusting your search query or price filter to discover available packages."
            action={{
              label: 'Reset Filters',
              onClick: () => {
                setSearch('');
                setPriceFilter('all');
              },
            }}
          />
        ) : (
          <div className={styles.bundlesGrid}>
            {filteredBundles.map((b) => {
              const bId = Number(b.id || b.bundleId || 0);
              return (
                <BundleCard
                  key={bId}
                  bundle={b}
                  isOwned={purchasedBundleIds.has(bId)}
                  onViewDetails={() => setSelectedBundle(b)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Bundle Detail Modal */}
      {selectedBundle && (() => {
        const b = selectedBundle;
        const bId = Number(b.id || b.bundleId || 0);
        const isOwned = purchasedBundleIds.has(bId) || Boolean(user && user.id === b.tutor?.id) || (user?.role as string) === 'admin';
        const rawItems = b.resources || (b.bundleItems || []).map((bi: any) => bi.resource).filter(Boolean) || [];
        const priceNum = Number(b.price || b.finalPrice || 0);
        const origPrice = Number(b.originalPrice || (priceNum > 0 ? Math.round(priceNum / 0.75) : 0));
        const hasDiscount = origPrice > priceNum && priceNum > 0;
        const discountPercent = b.discountPercent ?? (hasDiscount ? Math.round(((origPrice - priceNum) / origPrice) * 100) : 0);

        return (
          <div className={styles.modalOverlay} onClick={handleCloseModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--color-primary-50, #eff6ff)',
                      color: 'var(--color-primary-700, #1d4ed8)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      border: '1px solid var(--color-primary-200, #bfdbfe)',
                      textTransform: 'uppercase',
                    }}>
                      <Package size={12} /> Bundle Pack
                    </span>
                    {hasDiscount && (
                      <span style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        border: '1px solid #fecaca',
                      }}>
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-gray-900)', margin: 0 }}>
                    {b.name || b.title}
                  </h2>
                </div>
                <button className={styles.modalCloseBtn} onClick={handleCloseModal} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Tutor Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={b.tutor?.avatarUrl || b.tutor?.profilePic || undefined} name={b.tutor?.name || 'Tutor'} size="sm" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gray-800)' }}>
                      {b.tutor?.name || 'Verified Tutor'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                      Author & Educator
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className={styles.modalSectionTitle}>About this bundle</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', lineHeight: 1.5, margin: '6px 0 0' }}>
                    {b.description || 'This curated bundle brings together high-yield materials designed to master the subject efficiently.'}
                  </p>
                </div>

                {/* Included Materials */}
                <div>
                  <div className={styles.modalSectionTitle}>
                    <Layers size={14} />
                    <span>Included Materials ({rawItems.length})</span>
                  </div>
                  <div className={styles.materialsListLarge} style={{ marginTop: 8 }}>
                    {rawItems.map((res: any, idx: number) => {
                      const resTitle = res?.title || res?.filename || `Resource #${idx + 1}`;
                      const resType = res?.fileType || res?.type || 'PDF Document';
                      const resPrice = res?.price ? `₹${res.price}` : 'Free';
                      const fileUrl = res?.fileUrl;

                      return (
                        <div key={res?.id || res?.resourceId || idx} className={styles.materialRow}>
                          <div className={styles.materialRowLeft}>
                            {getFileIcon(res?.fileType || res?.type)}
                            <div style={{ minWidth: 0 }}>
                              <div className={styles.materialName}>{resTitle}</div>
                              <div className={styles.materialMeta}>
                                {resType.toUpperCase()} • Normal value: {resPrice}
                              </div>
                            </div>
                          </div>
                          {isOwned && fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: '0.75rem',
                                color: '#059669',
                                backgroundColor: '#ECFDF5',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                border: '1px solid #A7F3D0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBuyBundle(b)}
                              style={{
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                whiteSpace: 'nowrap',
                              }}
                              title="Buy bundle to unlock this study material"
                            >
                              <Lock size={12} />
                              <span>Locked • In Bundle</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {hasDiscount && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', textDecoration: 'line-through' }}>
                      ₹{origPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: priceNum === 0 ? '#10b981' : 'var(--color-primary-600, #2563eb)' }}>
                    {priceNum === 0 ? 'Free' : `₹${priceNum.toLocaleString('en-IN')}`}
                  </div>
                </div>

                {purchasedBundleIds.has(Number(b.id || b.bundleId || 0)) ? (
                  <button
                    type="button"
                    className={styles.modalBuyBtn}
                    style={{ background: '#059669' }}
                    onClick={() => {
                      toast.success('You own this bundle! All resources are unlocked above.');
                    }}
                  >
                    <span>✓ Owned • In Your Library</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.modalBuyBtn}
                    onClick={() => handleBuyBundle(b)}
                  >
                    <ShoppingBag size={16} />
                    <span>{priceNum === 0 ? 'Get Free Bundle' : `Buy Bundle Pack • ₹${priceNum.toLocaleString('en-IN')}`}</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modern Zero-Error Checkout Modal for Bundles */}
      {checkoutBundle && (
        <PaymentCheckoutModal
          isOpen={Boolean(checkoutBundle)}
          onClose={() => setCheckoutBundle(null)}
          item={{
            type: 'bundle',
            id: Number(checkoutBundle.id || checkoutBundle.bundleId || 0),
            title: checkoutBundle.name || checkoutBundle.title || 'Curated Study Bundle',
            price: Number(checkoutBundle.price || checkoutBundle.finalPrice || 0),
            tutorName: checkoutBundle.tutor?.name || undefined,
            tutorAvatar: checkoutBundle.tutor?.avatarUrl || checkoutBundle.tutor?.profilePic || undefined,
            description: checkoutBundle.description || undefined,
            itemCount: (checkoutBundle.resources || checkoutBundle.bundleItems || []).length,
          }}
          onSuccess={() => {
            const bId = Number(checkoutBundle.id || checkoutBundle.bundleId || 0);
            setPurchasedBundleIds((prev) => new Set([...prev, bId]));
            setCheckoutBundle(null);
          }}
        />
      )}
    </div>
  );
};
