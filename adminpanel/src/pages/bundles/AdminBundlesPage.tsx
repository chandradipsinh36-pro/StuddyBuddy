import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Package,
  CheckCircle2,
  Percent,
  TrendingUp,
  Search,
  RotateCcw,
  MoreVertical,
  Eye,
  Edit2,
  Globe,
  Lock,
  Trash2,
  X,
  FileText,
} from 'lucide-react';
import { adminBundleService } from '../../services/adminBundleService';
import type { AdminBundle } from '../../types/admin';
import { SearchInput } from '../../components/common/SearchInput';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminBundlesPage: React.FC = () => {
  const [bundles, setBundles] = useState<AdminBundle[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortOrder, setSortOrder] = useState<'createdAt' | 'title' | 'price'>('createdAt');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Action Menu
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Modals
  const [viewBundle, setViewBundle] = useState<AdminBundle | null>(null);
  const [editBundle, setEditBundle] = useState<AdminBundle | null>(null);
  const [deleteBundle, setDeleteBundle] = useState<AdminBundle | null>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number | string>(0);
  const [editOrigPrice, setEditOrigPrice] = useState<number | string>(0);
  const [editDiscount, setEditDiscount] = useState<number | string>(0);
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchBundles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminBundleService.getBundles({
        search,
        is_published: statusFilter,
        sort_by: sortOrder,
        page,
        limit,
      });
      setBundles(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      toast.error('Unable to load bundles');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sortOrder, page, limit]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const handleTogglePublish = async (bundle: AdminBundle) => {
    try {
      const updated = await adminBundleService.togglePublish(bundle.bundleId);
      toast.success(`Bundle ${updated.isPublished ? 'published' : 'unpublished'}`);
      fetchBundles();
    } catch {
      toast.error('Failed to change publish status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteBundle) return;
    try {
      await adminBundleService.deleteBundle(deleteBundle.bundleId);
      toast.success('Bundle deleted permanently');
      setDeleteBundle(null);
      fetchBundles();
    } catch {
      toast.error('Failed to delete bundle');
    }
  };

  const handleOpenEdit = (bundle: AdminBundle) => {
    setEditBundle(bundle);
    setEditTitle(bundle.title);
    setEditPrice(bundle.price);
    setEditOrigPrice(bundle.originalPrice || bundle.price);
    setEditDiscount(bundle.discountPercent || 0);
    setEditDesc(bundle.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBundle) return;
    setIsSaving(true);
    try {
      await adminBundleService.updateBundle(editBundle.bundleId, {
        title: editTitle,
        price: Number(editPrice),
        originalPrice: Number(editOrigPrice),
        discountPercent: Number(editDiscount),
        description: editDesc,
      });
      toast.success('Bundle updated successfully');
      setEditBundle(null);
      fetchBundles();
    } catch {
      toast.error('Failed to update bundle');
    } finally {
      setIsSaving(false);
    }
  };

  // KPIs
  const publishedCount = bundles.filter((b) => b.isPublished).length;
  const avgDiscount = bundles.length > 0
    ? Math.round(bundles.reduce((acc, b) => acc + (b.discountPercent || 0), 0) / bundles.length)
    : 0;
  const totalSalesCount = bundles.reduce((acc, b) => acc + (b.salesCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-gray-900)', letterSpacing: '-0.02em' }}>
            Bundle Management
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 2 }}>
            Manage discounted study material packages and resource bundles created by tutors.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Total Bundles
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
              {total}
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-success-light)', color: 'var(--color-success-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Published
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-success-dark)' }}>
              {publishedCount}
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'rgba(236, 72, 153, 0.1)', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Percent size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Avg. Discount
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#db2777' }}>
              {avgDiscount}%
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-warning-light)', color: 'var(--color-warning-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Total Purchases
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-warning-dark)' }}>
              {totalSalesCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ flex: '1 1 280px', maxWidth: 380 }}>
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search bundles or tutors..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val as any);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Bundles' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Drafts' },
            ]}
          />

          <FilterDropdown
            label="Sort"
            value={sortOrder}
            onChange={(val) => {
              setSortOrder(val as any);
              setPage(1);
            }}
            options={[
              { value: 'createdAt', label: 'Date Created' },
              { value: 'title', label: 'Bundle Title' },
              { value: 'price', label: 'Price' },
            ]}
          />

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setSortOrder('createdAt');
              setPage(1);
            }}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-gray-500)' }}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Bundles Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : bundles.length === 0 ? (
          <EmptyState
            title="No Bundles Found"
            message="No bundles match your current filter criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSearch('');
              setStatusFilter('all');
              setPage(1);
            }}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Bundle</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Tutor</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Orig. Price</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Discount</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Selling Price</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Materials</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((bundle) => {
                  const isMenuOpen = activeMenuId === bundle.bundleId;
                  const origNum = Number(bundle.originalPrice || bundle.price);
                  const priceNum = Number(bundle.price);

                  return (
                    <tr
                      key={bundle.bundleId}
                      style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background-color var(--transition-fast)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'rgba(236, 72, 153, 0.1)', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={18} />
                          </div>
                          <div>
                            <div
                              onClick={() => setViewBundle(bundle)}
                              style={{ fontWeight: 700, color: 'var(--color-gray-900)', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-600)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-gray-900)'; }}
                            >
                              {bundle.title}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {bundle.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <img
                            src={bundle.tutor?.profilePic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor'}
                            alt={bundle.tutor?.name || 'Tutor'}
                            style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-gray-800)', fontSize: 'var(--font-size-xs)' }}>
                              {bundle.tutor?.name || 'Tutor'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)' }}>
                              {bundle.tutor?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-500)', textDecoration: bundle.discountPercent ? 'line-through' : 'none' }}>
                        ₹{origNum.toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {bundle.discountPercent && bundle.discountPercent > 0 ? (
                          <span className="badge" style={{ backgroundColor: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8' }}>
                            {bundle.discountPercent}% OFF
                          </span>
                        ) : (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>None</span>
                        )}
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                        ₹{priceNum.toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>{bundle.resourcesCount}</span> resources
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span className={`badge ${bundle.isPublished ? 'badge-success' : 'badge-warning'}`}>
                          {bundle.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : bundle.bundleId)}
                          className="btn btn-ghost btn-icon-only"
                          aria-label="Bundle actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div onClick={() => setActiveMenuId(null)} style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-dropdown)' }} />
                            <div
                              className="admin-card animate-fade-in"
                              style={{
                                position: 'absolute',
                                right: 16,
                                top: 'calc(100% - 4px)',
                                width: 190,
                                padding: 'var(--space-1)',
                                zIndex: 'calc(var(--z-dropdown) + 1)',
                                boxShadow: 'var(--shadow-xl)',
                                textAlign: 'left',
                              }}
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setViewBundle(bundle);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Eye size={14} />
                                <span>View Included Files</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleTogglePublish(bundle);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: bundle.isPublished ? 'var(--color-warning-dark)' : 'var(--color-success-dark)', borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bundle.isPublished ? 'var(--color-warning-light)' : 'var(--color-success-light)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                {bundle.isPublished ? <Lock size={14} /> : <Globe size={14} />}
                                <span>{bundle.isPublished ? 'Unpublish' : 'Publish Bundle'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleOpenEdit(bundle);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Edit2 size={14} />
                                <span>Edit Pricing</span>
                              </button>

                              <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeleteBundle(bundle);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', fontWeight: 600, borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Trash2 size={14} />
                                <span>Delete Bundle</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div style={{ padding: '0 var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      </div>

      {/* View Bundle Materials Modal */}
      {viewBundle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="admin-card animate-scale-up" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div>
                <span className={`badge ${viewBundle.isPublished ? 'badge-success' : 'badge-warning'}`} style={{ marginBottom: 4 }}>
                  {viewBundle.isPublished ? 'Live & Published' : 'Draft / Unpublished'}
                </span>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                  {viewBundle.title}
                </h3>
              </div>
              <button onClick={() => setViewBundle(null)} className="btn btn-ghost btn-icon-only">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>
                  Description
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)', marginTop: 4 }}>
                  {viewBundle.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Original Price</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', textDecoration: 'line-through' }}>
                    ₹{Number(viewBundle.originalPrice || viewBundle.price).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Discount</div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--font-size-sm)', color: '#db2777' }}>
                    {viewBundle.discountPercent || 0}% OFF
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Bundle Price</div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--font-size-base)', color: 'var(--color-gray-900)' }}>
                    ₹{Number(viewBundle.price).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Included Resources */}
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                  Included Study Materials ({viewBundle.bundleItems?.length || 0})
                </div>
                {viewBundle.bundleItems && viewBundle.bundleItems.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {viewBundle.bundleItems.map((item: any, idx: number) => {
                      const res = item.resource;
                      return (
                        <div key={idx} style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <FileText size={15} style={{ color: 'var(--color-primary-600)' }} />
                            <span style={{ fontWeight: 600, color: 'var(--color-gray-800)' }}>
                              {res?.filename || `Resource #${item.resourceId}`}
                            </span>
                          </div>
                          <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            {res?.fileType || 'FILE'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                    No resources attached to this bundle yet.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button
                  onClick={() => {
                    handleTogglePublish(viewBundle);
                    setViewBundle(null);
                  }}
                  className={`btn ${viewBundle.isPublished ? 'btn-warning' : 'btn-success'} btn-sm`}
                >
                  {viewBundle.isPublished ? 'Unpublish Bundle' : 'Publish Bundle'}
                </button>
                <button onClick={() => setViewBundle(null)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bundle Modal */}
      {editBundle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <form onSubmit={handleSaveEdit} className="admin-card animate-scale-up" style={{ width: '100%', maxWidth: 520, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                Edit Bundle Pricing & Info
              </h3>
              <button type="button" onClick={() => setEditBundle(null)} className="btn btn-ghost btn-icon-only">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                  Bundle Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                    Orig. Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editOrigPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditOrigPrice(val);
                      const disc = Number(editDiscount);
                      if (disc > 0) {
                        setEditPrice(Math.round(val * (1 - disc / 100)));
                      }
                    }}
                    className="input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    value={editDiscount}
                    onChange={(e) => {
                      const disc = Number(e.target.value);
                      setEditDiscount(disc);
                      const orig = Number(editOrigPrice);
                      if (orig > 0) {
                        setEditPrice(Math.round(orig * (1 - disc / 100)));
                      }
                    }}
                    className="input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                    Final Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="input"
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setEditBundle(null)} className="btn btn-ghost btn-sm" disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteBundle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="admin-card animate-scale-up" style={{ width: '100%', maxWidth: 440, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>
              <Trash2 size={24} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800 }}>
                Delete Bundle
              </h3>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deleteBundle.title}</strong>? Included materials will remain in their tutor's repository, but the bundle offering will be deleted.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button onClick={() => setDeleteBundle(null)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn btn-danger btn-sm">
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
