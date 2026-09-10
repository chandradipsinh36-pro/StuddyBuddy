import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Package,
  ShoppingBag,
  Search,
  Check,
  FileText,
  Video,
  Image as ImageIcon,
  BookOpen,
  Trash2,
  Edit2,
  Eye,
  X,
  Sparkles,
  Layers,
  CheckCircle2,
  ExternalLink,
  Tag,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Modal } from '../../components/ui/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { resourceService } from '../../services/resourceService';
import { bundleService } from '../../services/bundleService';
import { ROUTES } from '../../constants';
import type { Bundle, Resource } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorBundlesPage.module.css';

export function TutorBundlesPage() {
  const { user } = useAuth();

  // Bundles state
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [viewingBundle, setViewingBundle] = useState<Bundle | null>(null);

  // Form State
  const [bundleName, setBundleName] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [originalPrice, setOriginalPrice] = useState('600');
  const [discount, setDiscount] = useState('30');
  const [formErrors, setFormErrors] = useState<{
    bundleName?: string;
    bundleDesc?: string;
    originalPrice?: string;
    discount?: string;
    resources?: string;
  }>({});

  // Resource Selector State
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);
  const [resourceSearch, setResourceSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'my' | 'pdf' | 'video'>('all');

  // Load Bundles and Resources on Page Mount
  useEffect(() => {
    fetchBundles();
    fetchResources();
  }, []);

  const fetchBundles = async () => {
    try {
      setLoadingBundles(true);
      const myBundles = await bundleService.getMyBundles();
      setBundles(myBundles || []);
    } catch (err) {
      console.warn('Unable to load bundles from API:', err);
      setBundles([]);
    } finally {
      setLoadingBundles(false);
    }
  };

  // Fetch only this tutor's own uploaded resources
  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const res = await resourceService.getMyResources({ limit: 100 });
      const rawList = res.data || [];
      // Strictly enforce tutor isolation
      const myMaterials = rawList.filter(r => {
        const uploaderId = Number(r.uploadedBy || (r.uploader as any)?.id || 0);
        return !user?.id || !uploaderId || uploaderId === user.id;
      });
      setAvailableResources(myMaterials);
    } catch (err) {
      console.error('Failed to load resources for bundle:', err);
      setAvailableResources([]);
    } finally {
      setLoadingResources(false);
    }
  };



  // Validation according to field with logical checks
  const validateBundleForm = (): boolean => {
    const errors: typeof formErrors = {};
    const trimmedName = bundleName.trim();
    if (!trimmedName) {
      errors.bundleName = 'Bundle name is required';
    } else if (trimmedName.length < 3) {
      errors.bundleName = 'Bundle name must be at least 3 characters';
    } else if (trimmedName.length > 150) {
      errors.bundleName = 'Bundle name cannot exceed 150 characters';
    }

    const trimmedDesc = bundleDesc.trim();
    if (!trimmedDesc) {
      errors.bundleDesc = 'Bundle overview description is required';
    } else if (trimmedDesc.length < 10) {
      errors.bundleDesc = 'Description must be at least 10 characters long';
    } else if (trimmedDesc.length > 2000) {
      errors.bundleDesc = 'Description cannot exceed 2000 characters';
    }

    if (!originalPrice || originalPrice.trim() === '') {
      errors.originalPrice = 'Standard price is required';
    } else {
      const origNum = parseFloat(originalPrice);
      if (isNaN(origNum)) {
        errors.originalPrice = 'Please enter a valid price number';
      } else if (origNum <= 0) {
        errors.originalPrice = 'Standard price must be greater than ₹0';
      } else if (origNum > 100000) {
        errors.originalPrice = 'Standard price cannot exceed ₹1,00,000';
      }
    }

    if (!discount || discount.trim() === '') {
      errors.discount = 'Discount percent is required (enter 0 for no discount)';
    } else {
      const discNum = parseFloat(discount);
      if (isNaN(discNum)) {
        errors.discount = 'Please enter a valid discount percentage';
      } else if (discNum < 0) {
        errors.discount = 'Discount cannot be negative';
      } else if (discNum > 99) {
        errors.discount = 'Discount cannot exceed 99%';
      }
    }

    if (selectedResourceIds.length === 0) {
      errors.resources = 'Please select at least one study material from the library below';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please resolve form validation errors before proceeding.');
    }
    return Object.keys(errors).length === 0;
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingBundle(null);
    resetForm();
    setFormErrors({});
    setModalOpen(true);
    if (availableResources.length === 0) {
      fetchResources();
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setBundleName(bundle.name || bundle.title || '');
    setBundleDesc(bundle.description || '');
    setOriginalPrice(String(bundle.originalPrice ?? bundle.price ?? 600));
    setDiscount(String(bundle.discountPercent ?? 0));
    setFormErrors({});

    // Extract already included resource IDs
    const existingIds: number[] = [];
    if (bundle.resources && bundle.resources.length > 0) {
      bundle.resources.forEach((r: any) => {
        const id = r.id ?? r.resourceId;
        if (id && !existingIds.includes(id)) existingIds.push(id);
      });
    }
    if (bundle.bundleItems && bundle.bundleItems.length > 0) {
      bundle.bundleItems.forEach((bi: any) => {
        const id = bi.resourceId ?? bi.resource?.resourceId ?? bi.resource?.id;
        if (id && !existingIds.includes(id)) existingIds.push(id);
      });
    }
    setSelectedResourceIds(existingIds);

    setModalOpen(true);
    if (availableResources.length === 0) {
      fetchResources();
    }
  };

  // Open View Modal
  const handleOpenViewModal = (bundle: Bundle) => {
    setViewingBundle(bundle);
    if (availableResources.length === 0) {
      fetchResources();
    }
  };

  // Toggle resource selection in form
  const toggleResource = (id: number) => {
    setSelectedResourceIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      if (next.length > 0) {
        setFormErrors(fe => ({ ...fe, resources: undefined }));
      }
      return next;
    });
  };

  const removeSelectedResource = (id: number) => {
    setSelectedResourceIds(prev => prev.filter(item => item !== id));
  };

  // Filtered resources list for the modal selector
  const filteredResources = useMemo(() => {
    return availableResources.filter(r => {
      // Strictly enforce tutor isolation: never expose resources from another tutor
      const uploaderId = Number(r.uploadedBy || (r.uploader as any)?.id || 0);
      if (user?.id && uploaderId && uploaderId !== user.id) {
        return false;
      }

      const query = resourceSearch.toLowerCase().trim();
      const titleMatch = (r.title || r.filename || '').toLowerCase().includes(query);
      const subjectMatch = (r.subject || r.category || '').toLowerCase().includes(query);
      const matchesSearch = !query || titleMatch || subjectMatch;

      if (!matchesSearch) return false;

      if (filterTab === 'pdf') {
        const type = (r.fileType || r.type || '').toLowerCase();
        return type.includes('pdf');
      }
      if (filterTab === 'video') {
        const type = (r.fileType || r.type || '').toLowerCase();
        return type.includes('video') || type.includes('youtube');
      }
      return true;
    });
  }, [availableResources, resourceSearch, filterTab, user?.id]);

  // Selected resources objects
  const selectedResources = useMemo(() => {
    return selectedResourceIds
      .map(id => availableResources.find(r => r.id === id || r.resourceId === id))
      .filter(Boolean) as Resource[];
  }, [availableResources, selectedResourceIds]);

  // Total standard value of selected resources
  const totalCombinedValue = useMemo(() => {
    return selectedResources.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
  }, [selectedResources]);

  // Auto-set standard price
  const handleAutoPrice = () => {
    if (totalCombinedValue > 0) {
      setOriginalPrice(String(totalCombinedValue));
      setFormErrors(prev => ({ ...prev, originalPrice: undefined }));
      toast.success(`Standard price set to ₹${totalCombinedValue}`);
    } else {
      setOriginalPrice('600');
    }
  };

  // Submit Bundle (Create or Update)
  const handleSubmitBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBundleForm()) {
      return;
    }

    const orig = parseFloat(originalPrice) || 0;
    const disc = parseFloat(discount) || 0;
    const finalP = Math.max(0, Math.round(orig * (1 - disc / 100)));

    setSubmitting(true);
    try {
      if (editingBundle) {
        // UPDATE EXISTING BUNDLE
        const bundleId = editingBundle.bundleId || editingBundle.id || 0;
        const updated = await bundleService.updateBundle(bundleId, {
          title: bundleName.trim(),
          description: bundleDesc.trim() || undefined,
          price: finalP,
          originalPrice: orig,
          discountPercent: disc,
          resourceIds: selectedResourceIds,
        });

        const fullUpdatedBundle: Bundle = {
          ...editingBundle,
          ...updated,
          price: finalP,
          originalPrice: orig,
          discountPercent: disc,
          finalPrice: finalP,
          resources: selectedResources,
        };

        setBundles(prev =>
          prev.map(b => ((b.bundleId || b.id) === bundleId ? fullUpdatedBundle : b))
        );

        if (viewingBundle && (viewingBundle.bundleId || viewingBundle.id) === bundleId) {
          setViewingBundle(fullUpdatedBundle);
        }

        toast.success(`Bundle "${bundleName}" updated successfully!`);
      } else {
        // CREATE NEW BUNDLE
        const created = await bundleService.createBundle({
          title: bundleName.trim(),
          description: bundleDesc.trim() || 'Curated package of study materials at a special discounted price.',
          price: finalP,
          originalPrice: orig,
          discountPercent: disc,
          resourceIds: selectedResourceIds,
        });

        const fullCreatedBundle: Bundle = {
          ...created,
          price: finalP,
          originalPrice: orig,
          discountPercent: disc,
          finalPrice: finalP,
          resources: selectedResources,
        };

        setBundles(prev => [fullCreatedBundle, ...prev]);
        toast.success(`Bundle "${bundleName}" published successfully!`);
      }

      setModalOpen(false);
      resetForm();
      await fetchBundles();
    } catch (err: any) {
      console.error('Error submitting bundle:', err);
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Failed to save bundle.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingBundle(null);
    setBundleName('');
    setBundleDesc('');
    setOriginalPrice('600');
    setDiscount('30');
    setSelectedResourceIds([]);
    setResourceSearch('');
    setFilterTab('all');
    setFormErrors({});
  };

  const handleDeleteBundle = async (bundleId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the bundle "${name}"?`)) return;
    try {
      await bundleService.deleteBundle(bundleId);
    } catch (err) {
      console.warn('Could not delete from backend, removing from view:', err);
    }
    setBundles(prev => prev.filter(b => (b.bundleId || b.id) !== bundleId));
    if (viewingBundle && (viewingBundle.bundleId || viewingBundle.id) === bundleId) {
      setViewingBundle(null);
    }
    toast.success(`Bundle "${name}" removed.`);
  };

  // Helper to render media type icon
  const getResourceIcon = (fileType?: string) => {
    const type = (fileType || '').toLowerCase();
    if (type.includes('pdf')) return <FileText size={16} />;
    if (type.includes('video') || type.includes('youtube')) return <Video size={16} />;
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return <ImageIcon size={16} />;
    return <BookOpen size={16} />;
  };

  // Helper to resolve items in viewing bundle
  const viewingBundleItems = useMemo(() => {
    if (!viewingBundle) return [];
    if (viewingBundle.resources && viewingBundle.resources.length > 0) {
      return viewingBundle.resources;
    }
    const biList = viewingBundle.bundleItems || [];
    return biList.map(bi => {
      if (bi.resource && (bi.resource.title || bi.resource.filename)) return bi.resource;
      const rId = bi.resourceId ?? bi.resource?.resourceId ?? bi.resource?.id;
      const match = availableResources.find(r => r.id === rId || r.resourceId === rId);
      if (match) return match;
      return {
        id: rId,
        resourceId: rId,
        title: bi.resource?.filename || `Resource #${rId}`,
        fileType: bi.resource?.fileType || 'pdf',
        price: bi.resource?.price ? Number(bi.resource.price) : 0,
      };
    });
  }, [viewingBundle, availableResources]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Resource Bundles & Packages</h1>
          <p className={styles.subtitle}>
            Offer multi-resource discounts to increase your average order value and help students save.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={handleOpenCreateModal}
        >
          Create New Bundle
        </Button>
      </div>

      {loadingBundles ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-gray-500)' }}>
          Loading bundles...
        </div>
      ) : bundles.length === 0 ? (
        <EmptyState
          title="No bundles created yet"
          description="Group your high-yield resources together and offer a bundled discount to students."
          action={{
            label: 'Create First Bundle',
            onClick: handleOpenCreateModal,
          }}
        />
      ) : (
        <div className={styles.grid}>
          {bundles.map(b => {
            const bundleId = b.bundleId || b.id || 0;
            const items =
              b.resources && b.resources.length > 0
                ? b.resources
                : (b.bundleItems || []).map(bi => bi.resource).filter(Boolean);
            const itemsCount = items.length;

            return (
              <div key={bundleId} className={styles.card}>
                <div className={styles.bundleHeader}>
                  <Badge variant="primary">
                    <Package size={12} style={{ marginRight: 4 }} />
                    {itemsCount} {itemsCount === 1 ? 'Material' : 'Materials'} Included
                  </Badge>

                  <div className={styles.headerActions}>
                    <Badge variant="success">{b.discountPercent ?? 20}% OFF</Badge>

                    {/* View Details Button */}
                    <button
                      className={styles.actionIconButton}
                      title="View bundle details"
                      onClick={() => handleOpenViewModal(b)}
                      aria-label="View bundle details"
                    >
                      <Eye size={14} />
                    </button>

                    {/* Edit Bundle Button */}
                    <button
                      className={styles.actionIconButton}
                      title="Edit bundle"
                      onClick={() => handleOpenEditModal(b)}
                      aria-label="Edit bundle"
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Delete Bundle Button */}
                    <button
                      className={`${styles.actionIconButton} ${styles.actionIconButtonDanger}`}
                      title="Delete bundle"
                      onClick={() => handleDeleteBundle(bundleId, b.name || b.title || 'Bundle')}
                      aria-label="Delete bundle"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h2
                  className={styles.bundleName}
                  onClick={() => handleOpenViewModal(b)}
                  title="Click to view details"
                >
                  {b.name || b.title}
                </h2>
                <p className={styles.bundleDesc}>{b.description}</p>

                {/* Included Materials List on the card */}
                {itemsCount > 0 && (
                  <div className={styles.materialsSection}>
                    <div className={styles.materialsLabel}>
                      <Layers size={13} />
                      <span>Included in this bundle ({itemsCount}):</span>
                    </div>
                    <div className={styles.materialsList}>
                      {items.map((res: any, idx: number) => (
                        <div key={res?.id || res?.resourceId || idx} className={styles.materialItem}>
                          {getResourceIcon(res?.fileType || res?.type)}
                          <span className={styles.materialTitle}>
                            {res?.title || res?.filename || `Resource #${res?.resourceId || idx + 1}`}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--color-gray-400)', whiteSpace: 'nowrap' }}>
                            {res?.price ? `₹${res.price}` : 'Free'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-gray-500)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  <ShoppingBag size={14} />
                  <span>{b.purchaseCount ?? 0} students bought this package</span>
                </div>

                <div className={styles.pricingRow}>
                  <div className={styles.priceGroup}>
                    <span className={styles.originalPrice}>₹{b.originalPrice}</span>
                    <span className={styles.finalPrice}>₹{b.finalPrice ?? b.price}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                    Save ₹{(Number(b.originalPrice || 0) - Number(b.finalPrice ?? b.price ?? 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE & EDIT TEACHING BUNDLE MODAL                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingBundle ? 'Edit Teaching Bundle' : 'Create Teaching Bundle'}
        size="lg"
      >
        <form onSubmit={handleSubmitBundle} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} noValidate>
          <Input
            label="Bundle Name *"
            placeholder="e.g. Complete JEE Physics & Chemistry Crash Course"
            value={bundleName}
            onChange={(e) => {
              setBundleName(e.target.value);
              if (formErrors.bundleName) setFormErrors(fe => ({ ...fe, bundleName: undefined }));
            }}
            error={formErrors.bundleName}
            required
          />

          <Textarea
            label="Bundle Description"
            placeholder="Highlight the benefits of buying these resources together, topics covered, target exams..."
            value={bundleDesc}
            onChange={(e) => {
              setBundleDesc(e.target.value);
              if (formErrors.bundleDesc) setFormErrors(fe => ({ ...fe, bundleDesc: undefined }));
            }}
            error={formErrors.bundleDesc}
            rows={3}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              label="Standard / Original Price (₹) *"
              type="number"
              min="0"
              placeholder="e.g. 600"
              value={originalPrice}
              onChange={(e) => {
                setOriginalPrice(e.target.value);
                if (formErrors.originalPrice) setFormErrors(fe => ({ ...fe, originalPrice: undefined }));
              }}
              error={formErrors.originalPrice}
              required
            />
            <Input
              label="Discount Percent (%) *"
              type="number"
              min="0"
              max="99"
              placeholder="e.g. 30"
              value={discount}
              onChange={(e) => {
                setDiscount(e.target.value);
                if (formErrors.discount) setFormErrors(fe => ({ ...fe, discount: undefined }));
              }}
              error={formErrors.discount}
              required
            />
          </div>

          {/* Live Calculated Price Breakdown */}
          {(() => {
            const orig = parseFloat(originalPrice) || 0;
            const disc = parseFloat(discount) || 0;
            const savings = Math.round(orig * (disc / 100));
            const finalP = Math.max(0, orig - savings);
            return (
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                      Standard Price
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155', textDecoration: disc > 0 ? 'line-through' : 'none' }}>
                      ₹{orig.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {disc > 0 && (
                    <>
                      <span style={{ color: '#94A3B8' }}>→</span>
                      <div>
                        <span style={{ fontSize: '11px', color: '#16A34A', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                          Discount ({disc}%)
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#16A34A' }}>
                          -₹{savings.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#4F46E5', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>
                    Student Selling Price
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#1E1B4B' }}>
                    ₹{finalP.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Section: Add / Edit Resources from Resource Library */}
          <div className={styles.resourceSection}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <h3 className={styles.sectionTitle}>
                  <Layers size={16} color="var(--color-primary-600)" />
                  Bundle Materials from Resource Page *
                </h3>
                <p className={styles.sectionSubtitle}>
                  Select study notes, video tutorials, and test series to package into this bundle.
                </p>
              </div>
              <Badge variant={selectedResourceIds.length > 0 ? 'primary' : 'outline'}>
                {selectedResourceIds.length} Selected
              </Badge>
            </div>

            {formErrors.resources && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-md)',
                color: '#B91C1C',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: 'var(--space-2)'
              }}>
                <AlertCircle size={15} />
                <span>{formErrors.resources}</span>
              </div>
            )}

            {/* Filter & Search Toolbar */}
            <div className={styles.filterControls}>
              <div className={styles.searchWrapper}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search resources by title, subject..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                />
              </div>

              <div className={styles.tabPills}>
                <button
                  type="button"
                  className={`${styles.tabPill} ${filterTab === 'all' ? styles.tabPillActive : ''}`}
                  onClick={() => setFilterTab('all')}
                >
                  All My Materials ({availableResources.length})
                </button>
                <button
                  type="button"
                  className={`${styles.tabPill} ${filterTab === 'pdf' ? styles.tabPillActive : ''}`}
                  onClick={() => setFilterTab('pdf')}
                >
                  PDF Documents
                </button>
                <button
                  type="button"
                  className={`${styles.tabPill} ${filterTab === 'video' ? styles.tabPillActive : ''}`}
                  onClick={() => setFilterTab('video')}
                >
                  Video Lectures
                </button>
              </div>
            </div>

            {/* Resource Selection List */}
            {loadingResources ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-gray-500)', fontSize: '13px' }}>
                Fetching materials from your resource library...
              </div>
            ) : availableResources.length === 0 ? (
              <div className={styles.emptyResourcesNotice} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'var(--color-gray-800)', fontSize: '14px' }}>
                  No uploaded resources found in your account
                </p>
                <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--color-gray-500)', lineHeight: 1.5 }}>
                  Only teaching materials you have uploaded can be selected for this bundle. Please upload your lecture notes or videos in the Resources page first.
                </p>
                <Link to={ROUTES.TUTOR_RESOURCE_CREATE}>
                  <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />}>
                    Upload New Resource
                  </Button>
                </Link>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className={styles.emptyResourcesNotice}>
                No materials found matching your search. Try adjusting keywords or selecting "All My Materials".
              </div>
            ) : (
              <div className={styles.resourceList}>
                {filteredResources.map(res => {
                  const resId = res.id ?? res.resourceId ?? 0;
                  const isSelected = selectedResourceIds.includes(resId);
                  const priceNum = Number(res.price || 0);

                  return (
                    <div
                      key={resId}
                      className={`${styles.resourceRow} ${isSelected ? styles.resourceRowSelected : ''}`}
                      onClick={() => toggleResource(resId)}
                    >
                      <div className={`${styles.checkboxBox} ${isSelected ? styles.checkboxBoxSelected : ''}`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>

                      <div className={styles.resourceIconWrap}>
                        {getResourceIcon(res.fileType || res.type)}
                      </div>

                      <div className={styles.resourceInfo}>
                        <span className={styles.resourceRowTitle}>
                          {res.title || res.filename || `Resource #${resId}`}
                        </span>
                        <div className={styles.resourceMeta}>
                          <span className={styles.metaItem}>
                            {res.subject || res.category || 'General'}
                          </span>
                          <span>•</span>
                          <span className={styles.metaItem}>
                            {(res.fileType || res.type || 'pdf').toUpperCase()}
                          </span>
                          {res.uploader?.name && (
                            <>
                              <span>•</span>
                              <span className={styles.metaItem}>by {res.uploader.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className={`${styles.resourceRowPrice} ${priceNum === 0 ? styles.resourceRowPriceFree : ''}`}>
                        {priceNum === 0 ? 'Free' : `₹${priceNum}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Summary Bar & Chips */}
            {selectedResourceIds.length > 0 && (
              <>
                <div className={styles.selectionSummary}>
                  <div className={styles.summaryLeft}>
                    <CheckCircle2 size={15} color="#4338ca" />
                    <span>
                      <strong>{selectedResourceIds.length}</strong> resources selected
                      {totalCombinedValue > 0 && ` • Combined item value: ₹${totalCombinedValue}`}
                    </span>
                  </div>

                  {totalCombinedValue > 0 && (
                    <button
                      type="button"
                      className={styles.autoPriceBtn}
                      onClick={handleAutoPrice}
                      title="Set original price to the sum of selected resources"
                    >
                      <Sparkles size={12} />
                      Set Standard Price to ₹{totalCombinedValue}
                    </button>
                  )}
                </div>

                {/* Removable chips for selected items */}
                <div className={styles.selectedChips}>
                  {selectedResources.map(res => {
                    const resId = res.id ?? res.resourceId ?? 0;
                    return (
                      <span key={resId} className={styles.selectedChip}>
                        {res.title || res.filename}
                        <button
                          type="button"
                          className={styles.chipRemoveBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedResource(resId);
                          }}
                          aria-label={`Remove ${res.title}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              {editingBundle ? 'Save Changes' : 'Publish Bundle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* VIEW BUNDLE DETAILS MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(viewingBundle)}
        onClose={() => setViewingBundle(null)}
        title="Bundle Details & Contents"
        size="lg"
      >
        {viewingBundle && (
          <div className={styles.viewContainer}>
            {/* Header & Title */}
            <div className={styles.viewHeader}>
              <div>
                <h2 className={styles.viewTitle}>{viewingBundle.name || viewingBundle.title}</h2>
                <p className={styles.viewDescription}>{viewingBundle.description}</p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className={styles.viewMetaGrid}>
              <div className={styles.viewMetaCard}>
                <span className={styles.viewMetaLabel}>Discount</span>
                <span className={styles.viewMetaValue} style={{ color: 'var(--color-success)' }}>
                  <Tag size={14} />
                  {viewingBundle.discountPercent ?? 25}% OFF
                </span>
              </div>

              <div className={styles.viewMetaCard}>
                <span className={styles.viewMetaLabel}>Materials</span>
                <span className={styles.viewMetaValue}>
                  <Package size={14} />
                  {viewingBundleItems.length} Included
                </span>
              </div>

              <div className={styles.viewMetaCard}>
                <span className={styles.viewMetaLabel}>Sales</span>
                <span className={styles.viewMetaValue}>
                  <ShoppingBag size={14} />
                  {viewingBundle.purchaseCount ?? 0} Students
                </span>
              </div>

              <div className={styles.viewMetaCard}>
                <span className={styles.viewMetaLabel}>Created</span>
                <span className={styles.viewMetaValue}>
                  <Calendar size={14} />
                  {new Date(viewingBundle.createdAt || '').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Pricing Highlight Banner */}
            <div className={styles.viewPricingBanner}>
              <div className={styles.pricingBannerLeft}>
                <div>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
                    Bundle Discounted Price
                  </div>
                  <div className={styles.pricingBannerPrice}>
                    ₹{viewingBundle.finalPrice ?? viewingBundle.price}
                  </div>
                </div>
                <div className={styles.pricingBannerOriginal}>
                  ₹{viewingBundle.originalPrice}
                </div>
              </div>

              <div className={styles.savingsTag}>
                <Sparkles size={13} />
                Student Savings: ₹
                {(
                  Number(viewingBundle.originalPrice || 0) -
                  Number(viewingBundle.finalPrice ?? viewingBundle.price ?? 0)
                ).toLocaleString()}
              </div>
            </div>

            {/* Materials List */}
            <div>
              <div className={styles.viewMaterialsHeader}>
                <h4 className={styles.viewMaterialsTitle}>
                  <Layers size={16} color="var(--color-primary-600)" />
                  Included Study Materials ({viewingBundleItems.length})
                </h4>
              </div>

              <div className={styles.viewMaterialsContainer}>
                {viewingBundleItems.length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '13px' }}>
                    No materials listed for this package.
                  </div>
                ) : (
                  viewingBundleItems.map((res: any, idx: number) => {
                    const resId = res.id ?? res.resourceId ?? idx + 1;
                    const priceVal = Number(res.price || 0);

                    return (
                      <div key={resId} className={styles.viewMaterialCard}>
                        <div className={styles.viewMaterialIcon}>
                          {getResourceIcon(res.fileType || res.type)}
                        </div>

                        <div className={styles.viewMaterialDetails}>
                          <h5 className={styles.viewMaterialTitle}>
                            {res.title || res.filename || `Resource #${resId}`}
                          </h5>
                          <div className={styles.viewMaterialMeta}>
                            <span>{res.subject || res.category || 'Study Material'}</span>
                            <span>•</span>
                            <span>{(res.fileType || res.type || 'PDF').toUpperCase()}</span>
                            <span>•</span>
                            <span style={{ fontWeight: 600, color: priceVal === 0 ? 'var(--color-success)' : 'var(--color-gray-800)' }}>
                              {priceVal === 0 ? 'Free' : `₹${priceVal}`}
                            </span>
                          </div>
                        </div>

                        {resId && (
                          <Link
                            to={ROUTES.RESOURCE_DETAIL(resId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewResourceButton}
                            title="Open resource page in new tab"
                          >
                            <span>Open</span>
                            <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className={styles.viewFooterActions}>
              <Button
                variant="secondary"
                leftIcon={<Edit2 size={14} />}
                onClick={() => {
                  const b = viewingBundle;
                  setViewingBundle(null);
                  handleOpenEditModal(b);
                }}
              >
                Edit This Bundle
              </Button>
              <Button variant="primary" onClick={() => setViewingBundle(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
