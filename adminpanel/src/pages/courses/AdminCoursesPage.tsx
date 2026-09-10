import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  CheckCircle2,
  FileQuestion,
  Users,
  Search,
  RotateCcw,
  MoreVertical,
  Eye,
  Edit2,
  Globe,
  Lock,
  Trash2,
  Layers,
  X,
  IndianRupee,
} from 'lucide-react';
import { adminCourseService } from '../../services/adminCourseService';
import type { AdminCourse } from '../../types/admin';
import { SearchInput } from '../../components/common/SearchInput';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
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
  const [viewCourse, setViewCourse] = useState<AdminCourse | null>(null);
  const [editCourse, setEditCourse] = useState<AdminCourse | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<AdminCourse | null>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number | string>(0);
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminCourseService.getCourses({
        search,
        is_published: statusFilter,
        sort_by: sortOrder,
        page,
        limit,
      });
      setCourses(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      toast.error('Unable to load courses');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, sortOrder, page, limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleTogglePublish = async (course: AdminCourse) => {
    try {
      const updated = await adminCourseService.togglePublish(course.courseId);
      toast.success(`Course ${updated.isPublished ? 'published' : 'unpublished'}`);
      fetchCourses();
    } catch {
      toast.error('Failed to change publish status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCourse) return;
    try {
      await adminCourseService.deleteCourse(deleteCourse.courseId);
      toast.success('Course deleted permanently');
      setDeleteCourse(null);
      fetchCourses();
    } catch {
      toast.error('Failed to delete course');
    }
  };

  const handleOpenEdit = (course: AdminCourse) => {
    setEditCourse(course);
    setEditTitle(course.title);
    setEditPrice(course.price);
    setEditDesc(course.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourse) return;
    setIsSaving(true);
    try {
      await adminCourseService.updateCourse(editCourse.courseId, {
        title: editTitle,
        price: Number(editPrice),
        description: editDesc,
      });
      toast.success('Course updated successfully');
      setEditCourse(null);
      fetchCourses();
    } catch {
      toast.error('Failed to update course');
    } finally {
      setIsSaving(false);
    }
  };

  // KPIs
  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = courses.filter((c) => !c.isPublished).length;
  const totalEnrollments = courses.reduce((acc, c) => acc + (c.enrollmentsCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-gray-900)', letterSpacing: '-0.02em' }}>
            Course Management
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 2 }}>
            Manage, review, publish, and moderate all courses created by tutors across StudyBuddy.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Total Courses
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
            <FileQuestion size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Drafts / Unpublished
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-warning-dark)' }}>
              {draftCount}
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
              Enrolled Students
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#4f46e5' }}>
              {totalEnrollments}
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
            placeholder="Search courses or tutors..."
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
              { value: 'all', label: 'All Courses' },
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
              { value: 'title', label: 'Course Title' },
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

      {/* Courses Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            title="No Courses Found"
            message="No courses match your current filter criteria."
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
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Course</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Tutor</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Price</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Curriculum</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Enrollments</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const isMenuOpen = activeMenuId === course.courseId;
                  const priceNum = Number(course.price);

                  return (
                    <tr
                      key={course.courseId}
                      style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background-color var(--transition-fast)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <div
                              onClick={() => setViewCourse(course)}
                              style={{ fontWeight: 700, color: 'var(--color-gray-900)', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-600)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-gray-900)'; }}
                            >
                              {course.title}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                              {course.category?.name || 'General Education'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <img
                            src={course.tutor?.profilePic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor'}
                            alt={course.tutor?.name || 'Tutor'}
                            style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-gray-800)', fontSize: 'var(--font-size-xs)' }}>
                              {course.tutor?.name || 'Instructor'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)' }}>
                              {course.tutor?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                        {priceNum === 0 ? (
                          <span className="badge badge-success">Free</span>
                        ) : (
                          `₹${priceNum.toLocaleString('en-IN')}`
                        )}
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-gray-800)' }}>{course.lessonsCount}</span> lessons
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>{course.enrollmentsCount}</span> students
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : course.courseId)}
                          className="btn btn-ghost btn-icon-only"
                          aria-label="Course actions"
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
                                  setViewCourse(course);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Eye size={14} />
                                <span>View Details</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleTogglePublish(course);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: course.isPublished ? 'var(--color-warning-dark)' : 'var(--color-success-dark)', borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = course.isPublished ? 'var(--color-warning-light)' : 'var(--color-success-light)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                {course.isPublished ? <Lock size={14} /> : <Globe size={14} />}
                                <span>{course.isPublished ? 'Unpublish' : 'Publish Course'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleOpenEdit(course);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-700)', borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Edit2 size={14} />
                                <span>Edit Course</span>
                              </button>

                              <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeleteCourse(course);
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0.45rem var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', fontWeight: 600, borderRadius: 'var(--radius-md)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Trash2 size={14} />
                                <span>Delete Course</span>
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

      {/* View Course Details Modal */}
      {viewCourse && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="admin-card animate-scale-up" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div>
                <span className={`badge ${viewCourse.isPublished ? 'badge-success' : 'badge-warning'}`} style={{ marginBottom: 4 }}>
                  {viewCourse.isPublished ? 'Live & Published' : 'Draft / Unpublished'}
                </span>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                  {viewCourse.title}
                </h3>
              </div>
              <button onClick={() => setViewCourse(null)} className="btn btn-ghost btn-icon-only">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>
                  Overview & Description
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)', marginTop: 4, whiteSpace: 'pre-line' }}>
                  {viewCourse.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Price</div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--font-size-base)', color: 'var(--color-gray-900)' }}>
                    {Number(viewCourse.price) === 0 ? 'Free' : `₹${Number(viewCourse.price).toLocaleString('en-IN')}`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Category</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-800)' }}>
                    {viewCourse.category?.name || 'General'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Instructor</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-800)' }}>
                    {viewCourse.tutor?.name} ({viewCourse.tutor?.email})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>Enrolled Students</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-600)' }}>
                    {viewCourse.enrollmentsCount} active
                  </div>
                </div>
              </div>

              {/* Lessons Breakdown */}
              {viewCourse.lessons && viewCourse.lessons.length > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                    Curriculum Lessons ({viewCourse.lessons.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {viewCourse.lessons.map((lesson: any, idx: number) => (
                      <div key={idx} style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-gray-800)' }}>
                          {idx + 1}. {lesson.title}
                        </div>
                        {lesson.videoUrl && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-primary-600)', background: 'var(--color-primary-50)', padding: '2px 6px', borderRadius: 4 }}>
                            Video Linked
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button
                  onClick={() => {
                    handleTogglePublish(viewCourse);
                    setViewCourse(null);
                  }}
                  className={`btn ${viewCourse.isPublished ? 'btn-warning' : 'btn-success'} btn-sm`}
                >
                  {viewCourse.isPublished ? 'Unpublish Course' : 'Publish Course'}
                </button>
                <button onClick={() => setViewCourse(null)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editCourse && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <form onSubmit={handleSaveEdit} className="admin-card animate-scale-up" style={{ width: '100%', maxWidth: 520, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                Edit Course
              </h3>
              <button type="button" onClick={() => setEditCourse(null)} className="btn btn-ghost btn-icon-only">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                  Course Title
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

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                  Price (₹ INR)
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

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                  Course Description / Overview
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
                <button type="button" onClick={() => setEditCourse(null)} className="btn btn-ghost btn-sm" disabled={isSaving}>
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
      {deleteCourse && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="admin-card animate-scale-up" style={{ width: '100%', maxWidth: 440, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>
              <Trash2 size={24} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800 }}>
                Delete Course
              </h3>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deleteCourse.title}</strong>? All associated enrollments, reviews, and lesson records will be removed. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button onClick={() => setDeleteCourse(null)} className="btn btn-ghost btn-sm">
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
