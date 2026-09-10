import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  RotateCcw,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  FileCheck,
  FileX,
  AlertCircle,
  File,
} from 'lucide-react';
import { adminResourceService } from '../../services/adminResourceService';
import type { AdminResource } from '../../types/admin';
import { SearchInput } from '../../components/common/SearchInput';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<string>('all');
  const [fileType, setFileType] = useState<string>('all');
  const [lockFilter, setLockFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [sortOrder, setSortOrder] = useState<'createdAt' | 'filename' | 'price'>('createdAt');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Action Menu
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Modals
  const [viewResource, setViewResource] = useState<AdminResource | null>(null);
  const [editResource, setEditResource] = useState<AdminResource | null>(null);
  const [deleteResource, setDeleteResource] = useState<AdminResource | null>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number | string>(0);
  const [editIsLocked, setEditIsLocked] = useState(false);
  const [editStatus, setEditStatus] = useState('published');
  const [isSaving, setIsSaving] = useState(false);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminResourceService.getResources({
        search,
        status: statusTab !== 'all' ? statusTab : undefined,
        file_type: fileType !== 'all' ? fileType : undefined,
        is_locked: lockFilter,
        sort_by: sortOrder,
        page,
        limit,
      });
      setResources(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      toast.error('Unable to load resources');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusTab, fileType, lockFilter, sortOrder, page, limit]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleUpdateStatus = async (resourceId: number, newStatus: string) => {
    try {
      await adminResourceService.updateStatus(resourceId, newStatus);
      toast.success(`Resource status updated to ${newStatus}`);
      fetchResources();
    } catch {
      toast.error('Failed to update resource status');
    }
  };

  const handleToggleLock = async (resource: AdminResource) => {
    try {
      const updated = await adminResourceService.toggleLock(resource.resourceId);
      toast.success(`Resource is now ${updated.isLocked ? 'locked (premium)' : 'unlocked (free)'}`);
      fetchResources();
    } catch {
      toast.error('Failed to toggle lock');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteResource) return;
    try {
      await adminResourceService.deleteResource(deleteResource.resourceId);
      toast.success('Resource deleted permanently');
      setDeleteResource(null);
      fetchResources();
    } catch {
      toast.error('Failed to delete resource');
    }
  };

  const handleOpenEdit = (res: AdminResource) => {
    setEditResource(res);
    setEditTitle(res.title || res.filename);
    setEditPrice(res.price);
    setEditIsLocked(res.isLocked);
    setEditStatus(res.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editResource) return;
    setIsSaving(true);
    try {
      await adminResourceService.updateResource(editResource.resourceId, {
        title: editTitle,
        price: Number(editPrice),
        isLocked: editIsLocked,
        status: editStatus,
      });
      toast.success('Resource updated successfully');
      setEditResource(null);
      fetchResources();
    } catch {
      toast.error('Failed to update resource');
    } finally {
      setIsSaving(false);
    }
  };

  // KPIs
  const publishedCount = resources.filter((r) => r.status === 'published').length;
  const underReviewCount = resources.filter((r) => r.status === 'under_review' || r.status === 'draft').length;
  const lockedCount = resources.filter((r) => r.isLocked).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-gray-900)', letterSpacing: '-0.02em' }}>
            Resource Management
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 2 }}>
            Review, approve, lock, and moderate all educational study materials and lecture files.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Total Resources
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
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-warning-light)', color: 'var(--color-warning-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Needs Review / Drafts
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-warning-dark)' }}>
              {underReviewCount}
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Premium / Locked
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#ea580c' }}>
              {lockedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'published', label: 'Published' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'draft', label: 'Drafts' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusTab(tab.id);
                setPage(1);
              }}
              style={{
                padding: '0.45rem var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: statusTab === tab.id ? 700 : 500,
                color: statusTab === tab.id ? 'var(--color-primary-600)' : 'var(--color-gray-600)',
                backgroundColor: statusTab === tab.id ? 'var(--color-primary-50)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Filters row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ flex: '1 1 280px', maxWidth: 380 }}>
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search filename or tutor..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <FilterDropdown
              label="Type"
              value={fileType}
              onChange={(val) => {
                setFileType(val);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'pdf', label: 'PDF Documents' },
                { value: 'image', label: 'Images' },
                { value: 'ppt', label: 'Presentations (PPT)' },
                { value: 'youtube', label: 'Video Lectures' },
                { value: 'audio', label: 'Audio Tracks' },
                { value: 'test_paper', label: 'Test Papers' },
              ]}
            />

            <FilterDropdown
              label="Access"
              value={lockFilter}
              onChange={(val) => {
                setLockFilter(val as any);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Access' },
                { value: 'unlocked', label: 'Free (Unlocked)' },
                { value: 'locked', label: 'Premium (Locked)' },
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
                { value: 'createdAt', label: 'Date Added' },
                { value: 'filename', label: 'File Name' },
                { value: 'price', label: 'Price' },
              ]}
            />

            <button
              onClick={() => {
                setSearch('');
                setStatusTab('all');
                setFileType('all');
                setLockFilter('all');
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
      </div>

      {/* Resources Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : resources.length === 0 ? (
          <EmptyState
            title="No Resources Found"
            message="No study materials match your current filter criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSearch('');
              setStatusTab('all');
              setFileType('all');
              setLockFilter('all');
              setPage(1);
            }}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Resource File</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Type</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Uploader</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Access & Price</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Date Uploaded</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res) => {
                  const isMenuOpen = activeMenuId === res.resourceId;
                  const priceNum = Number(res.price);

                  return (
                    <tr
                      key={res.resourceId}
                      style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background-color var(--transition-fast)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div
                              onClick={() => setViewResource(res)}
                              style={{ fontWeight: 700, color: 'var(--color-gray-900)', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-600)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-gray-900)'; }}
                            >
                              {res.title || res.filename}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                              {res.categoryName || res.course?.title || 'Standalone Resource'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700 }}>
                          {res.fileType}
                        </span>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <img
                            src={res.uploader?.profilePic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Uploader'}
                            alt={res.uploader?.name || 'Tutor'}
                            style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-gray-800)', fontSize: 'var(--font-size-xs)' }}>
                              {res.uploader?.name || 'Tutor'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)' }}>
                              {res.uploader?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {res.isLocked ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: '#ea580c', fontWeight: 700 }}>
                            <Lock size={13} />
                            <span>₹{priceNum.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-success-dark)', fontWeight: 600 }}>
                            <Unlock size={13} />
                            <span>Free</span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span
                          className={`badge ${
                            res.status === 'published'
                              ? 'badge-success'
                              : res.status === 'under_review'
                              ? 'badge-warning'
                              : res.status === 'rejected'
                              ? 'badge-danger'
                              : 'badge-neutral'
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-gray-600)', fontSize: 'var(--font-size-xs)' }}>
                        {new Date(res.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : res.resourceId)}
                          className="btn btn-ghost btn-icon-only"
                          aria-label="Resource actions"
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
                                width: 195,
                                padding: 'var(--space-1)',
                                zIndex: 'calc(var(--z-dropdown) + 1)',
                                boxShadow: 'var(--shadow-xl)',
                                textAlign: 'left',
                              }}
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setViewResource(res);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Eye size={14} />
                                <span>Inspect Details</span>
                              </button>

                              {res.status !== 'published' && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleUpdateStatus(res.resourceId, 'published');
                                  }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-success-dark)', borderRadius: 'var(--radius-md)' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-success-light)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                  <FileCheck size={14} />
                                  <span>Approve & Publish</span>
                                </button>
                              )}

                              {res.status !== 'rejected' && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleUpdateStatus(res.resourceId, 'rejected');
                                  }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                  <FileX size={14} />
                                  <span>Reject Resource</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleToggleLock(res);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                {res.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                                <span>{res.isLocked ? 'Make Free' : 'Lock (Premium)'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleOpenEdit(res);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Edit2 size={14} />
                                <span>Edit Resource</span>
                              </button>

                              <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeleteResource(res);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', fontWeight: 600, borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Trash2 size={14} />
                                <span>Delete Resource</span>
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

      {/* Inspect Resource Details Modal */}
      {viewResource && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="admin-card animate-scale-up" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div>
                <span className={`badge ${viewResource.status === 'published' ? 'badge-success' : 'badge-warning'}`} style={{ marginBottom: 4 }}>
                  Status: {viewResource.status}
                </span>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                  {viewResource.title || viewResource.filename}
                </h3>
              </div>
              <button onClick={() => setViewResource(null)} className="btn btn-ghost btn-icon-only">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {viewResource.description && (
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>
                    Description
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)', marginTop: 4 }}>
                    {viewResource.description}
                  </p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>File Type</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-800)', textTransform: 'uppercase' }}>
                    {viewResource.fileType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Access Model</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: viewResource.isLocked ? '#ea580c' : 'var(--color-success-dark)' }}>
                    {viewResource.isLocked ? `Premium • ₹${viewResource.price}` : 'Free Access'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Uploader</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-800)' }}>
                    {viewResource.uploader?.name} ({viewResource.uploader?.email})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Direct File URL</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {viewResource.fileUrl || 'No file link stored'}
                  </div>
                </div>
              </div>

              {viewResource.fileUrl && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <File size={18} style={{ color: 'var(--color-primary-600)' }} />
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-800)' }}>
                      Download / Open Resource File
                    </span>
                  </div>
                  <a
                    href={viewResource.fileUrl.startsWith('http') ? viewResource.fileUrl : `http://localhost:5000${viewResource.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                  >
                    <ExternalLink size={14} />
                    <span>Open File</span>
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                {viewResource.status !== 'published' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(viewResource.resourceId, 'published');
                      setViewResource(null);
                    }}
                    className="btn btn-success btn-sm"
                  >
                    Approve & Publish
                  </button>
                )}
                <button onClick={() => setViewResource(null)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {editResource && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <form onSubmit={handleSaveEdit} className="admin-card animate-scale-up" style={{ width: '100%', maxWidth: 500, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                Edit Resource Details
              </h3>
              <button type="button" onClick={() => setEditResource(null)} className="btn btn-ghost btn-icon-only">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                  Resource Title
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                    Access Type
                  </label>
                  <select
                    value={editIsLocked ? 'locked' : 'unlocked'}
                    onChange={(e) => {
                      const locked = e.target.value === 'locked';
                      setEditIsLocked(locked);
                      if (!locked) setEditPrice(0);
                    }}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="unlocked">Free (Unlocked)</option>
                    <option value="locked">Premium (Locked)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                    Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={!editIsLocked}
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
                  Moderation Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="published">Published (Approved)</option>
                  <option value="under_review">Under Review</option>
                  <option value="draft">Draft</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setEditResource(null)} className="btn btn-ghost btn-sm" disabled={isSaving}>
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
      {deleteResource && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="admin-card animate-scale-up" style={{ width: '100%', maxWidth: 440, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>
              <Trash2 size={24} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800 }}>
                Delete Resource
              </h3>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deleteResource.filename}</strong>? The file will be erased from platform storage and decoupled from any bundles.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button onClick={() => setDeleteResource(null)} className="btn btn-ghost btn-sm">
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
