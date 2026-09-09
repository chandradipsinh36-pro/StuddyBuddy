import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserMinus,
  UserX,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  FolderTree,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
} from 'lucide-react';
import { ROUTES } from '../../constants';
import { adminDashboardService } from '../../services/adminDashboardService';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    adminDashboardService.getOverview()
      .then(d => setPendingCount(d.tutors.pending))
      .catch(() => {});
  }, [location.pathname]);

  const isLinkActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 'var(--z-sidebar)',
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
          backgroundColor: 'var(--color-white)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 'calc(var(--z-sidebar) + 1)',
          transition: 'width var(--transition-base), transform var(--transition-base)',
          transform: mobileOpen
            ? 'translateX(0)'
            : window.innerWidth <= 768
            ? 'translateX(-100%)'
            : 'translateX(0)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '0' : '0 var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                flexShrink: 0,
              }}
            >
              <Shield size={20} strokeWidth={2.2} />
            </div>

            {!collapsed && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 800, fontSize: 'var(--font-size-base)', color: 'var(--color-gray-900)', letterSpacing: '-0.02em' }}>
                    StudyBuddy
                  </span>
                  <span className="badge badge-admin" style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}>
                    ADMIN
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)', fontWeight: 500 }}>
                  Console v1.0
                </div>
              </div>
            )}
          </div>

          {/* Close for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="btn btn-ghost btn-icon-only"
            style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-4) var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          {/* Main Section */}
          <div>
            {!collapsed && (
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-gray-400)',
                  padding: '0 var(--space-3) var(--space-2)',
                }}
              >
                Admin Panel
              </div>
            )}
            <NavLink
              to={ROUTES.DASHBOARD}
              end
              onClick={() => window.innerWidth <= 768 && onCloseMobile()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '0.6rem var(--space-3)',
                borderRadius: 'var(--radius-md)',
                color: isLinkActive(ROUTES.DASHBOARD, true)
                  ? 'var(--color-primary-600)'
                  : 'var(--color-gray-600)',
                backgroundColor: isLinkActive(ROUTES.DASHBOARD, true)
                  ? 'var(--color-primary-50)'
                  : 'transparent',
                fontWeight: isLinkActive(ROUTES.DASHBOARD, true) ? 600 : 500,
                fontSize: 'var(--font-size-sm)',
                transition: 'all var(--transition-fast)',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              title={collapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard size={19} />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
          </div>

          {/* User Management Section */}
          <div>
            {!collapsed && (
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-gray-400)',
                  padding: '0 var(--space-3) var(--space-2)',
                }}
              >
                User Management
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <NavLink
                to={ROUTES.USERS}
                end
                onClick={() => window.innerWidth <= 768 && onCloseMobile()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '0.55rem var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: isLinkActive(ROUTES.USERS, true)
                    ? 'var(--color-primary-600)'
                    : 'var(--color-gray-600)',
                  backgroundColor: isLinkActive(ROUTES.USERS, true)
                    ? 'var(--color-primary-50)'
                    : 'transparent',
                  fontWeight: isLinkActive(ROUTES.USERS, true) ? 600 : 500,
                  fontSize: 'var(--font-size-sm)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                title={collapsed ? 'All Users' : undefined}
              >
                <Users size={18} />
                {!collapsed && <span>All Users</span>}
              </NavLink>

              <NavLink
                to={`${ROUTES.USERS}?role=student`}
                onClick={() => window.innerWidth <= 768 && onCloseMobile()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '0.55rem var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: location.search.includes('role=student')
                    ? 'var(--color-primary-600)'
                    : 'var(--color-gray-600)',
                  backgroundColor: location.search.includes('role=student')
                    ? 'var(--color-primary-50)'
                    : 'transparent',
                  fontWeight: location.search.includes('role=student') ? 600 : 500,
                  fontSize: 'var(--font-size-sm)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                title={collapsed ? 'Students' : undefined}
              >
                <UserCheck size={18} />
                {!collapsed && <span>Students</span>}
              </NavLink>

              <NavLink
                to={`${ROUTES.USERS}?status=suspended`}
                onClick={() => window.innerWidth <= 768 && onCloseMobile()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '0.55rem var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: location.search.includes('status=suspended')
                    ? 'var(--color-suspended-dark)'
                    : 'var(--color-gray-600)',
                  backgroundColor: location.search.includes('status=suspended')
                    ? 'var(--color-suspended-light)'
                    : 'transparent',
                  fontWeight: location.search.includes('status=suspended') ? 600 : 500,
                  fontSize: 'var(--font-size-sm)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                title={collapsed ? 'Suspended Users' : undefined}
              >
                <UserMinus size={18} />
                {!collapsed && <span>Suspended Users</span>}
              </NavLink>

              <NavLink
                to={`${ROUTES.USERS}?status=banned`}
                onClick={() => window.innerWidth <= 768 && onCloseMobile()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '0.55rem var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: location.search.includes('status=banned')
                    ? 'var(--color-danger-dark)'
                    : 'var(--color-gray-600)',
                  backgroundColor: location.search.includes('status=banned')
                    ? 'var(--color-danger-light)'
                    : 'transparent',
                  fontWeight: location.search.includes('status=banned') ? 600 : 500,
                  fontSize: 'var(--font-size-sm)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                title={collapsed ? 'Banned Users' : undefined}
              >
                <UserX size={18} />
                {!collapsed && <span>Banned Users</span>}
              </NavLink>
            </div>
          </div>

          {/* Tutor Management Section */}
          <div>
            {!collapsed && (
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-gray-400)',
                  padding: '0 var(--space-3) var(--space-2)',
                }}
              >
                Tutor Management
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <NavLink
                to={ROUTES.TUTORS}
                end
                onClick={() => window.innerWidth <= 768 && onCloseMobile()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '0.55rem var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: isLinkActive(ROUTES.TUTORS, true)
                    ? 'var(--color-primary-600)'
                    : 'var(--color-gray-600)',
                  backgroundColor: isLinkActive(ROUTES.TUTORS, true)
                    ? 'var(--color-primary-50)'
                    : 'transparent',
                  fontWeight: isLinkActive(ROUTES.TUTORS, true) ? 600 : 500,
                  fontSize: 'var(--font-size-sm)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                title={collapsed ? 'All Tutors' : undefined}
              >
                <GraduationCap size={18} />
                {!collapsed && <span>All Tutors</span>}
              </NavLink>

              <NavLink
                to={ROUTES.TUTOR_APPLICATIONS}
                onClick={() => window.innerWidth <= 768 && onCloseMobile()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: isLinkActive(ROUTES.TUTOR_APPLICATIONS)
                    ? 'var(--color-warning-dark)'
                    : 'var(--color-gray-600)',
                  backgroundColor: isLinkActive(ROUTES.TUTOR_APPLICATIONS)
                    ? 'var(--color-warning-light)'
                    : 'transparent',
                  fontWeight: isLinkActive(ROUTES.TUTOR_APPLICATIONS) ? 600 : 500,
                  fontSize: 'var(--font-size-sm)',
                }}
                title={collapsed ? 'Pending Applications' : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Clock size={18} />
                  {!collapsed && <span>Applications</span>}
                </div>
                {!collapsed && pendingCount !== null && pendingCount > 0 && (
                  <span
                    className="badge badge-warning"
                    style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                  >
                    {pendingCount}
                  </span>
                )}
              </NavLink>

              <NavLink
                to={`${ROUTES.TUTORS}?status=approved`}
                onClick={() => window.innerWidth <= 768 && onCloseMobile()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '0.55rem var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: location.search.includes('status=approved')
                    ? 'var(--color-success-dark)'
                    : 'var(--color-gray-600)',
                  backgroundColor: location.search.includes('status=approved')
                    ? 'var(--color-success-light)'
                    : 'transparent',
                  fontWeight: location.search.includes('status=approved') ? 600 : 500,
                  fontSize: 'var(--font-size-sm)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                title={collapsed ? 'Approved Tutors' : undefined}
              >
                <CheckCircle2 size={18} />
                {!collapsed && <span>Approved Tutors</span>}
              </NavLink>

              <NavLink
                to={`${ROUTES.TUTOR_APPLICATIONS}?tab=rejected`}
                onClick={() => window.innerWidth <= 768 && onCloseMobile()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '0.55rem var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: location.search.includes('tab=rejected')
                    ? 'var(--color-danger-dark)'
                    : 'var(--color-gray-600)',
                  backgroundColor: location.search.includes('tab=rejected')
                    ? 'var(--color-danger-light)'
                    : 'transparent',
                  fontWeight: location.search.includes('tab=rejected') ? 600 : 500,
                  fontSize: 'var(--font-size-sm)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                title={collapsed ? 'Rejected Applications' : undefined}
              >
                <XCircle size={18} />
                {!collapsed && <span>Rejected</span>}
              </NavLink>
            </div>
          </div>

          {/* Coming Soon Modules */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-gray-400)',
                  padding: '0 var(--space-3) var(--space-2)',
                }}
              >
                System (Planned)
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', opacity: 0.55 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem var(--space-3)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-gray-500)',
                  cursor: 'not-allowed',
                }}
                title="Categories moderation coming soon"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <FolderTree size={18} />
                  {!collapsed && <span>Categories</span>}
                </div>
                {!collapsed && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray-400)' }}>Soon</span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem var(--space-3)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-gray-500)',
                  cursor: 'not-allowed',
                }}
                title="Platform settings coming soon"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Settings size={18} />
                  {!collapsed && <span>Platform Config</span>}
                </div>
                {!collapsed && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray-400)' }}>Soon</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Toggle */}
        <div
          style={{
            padding: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
          }}
        >
          <button
            onClick={onToggleCollapse}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--color-gray-500)',
              fontSize: 'var(--font-size-xs)',
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : (
              <>
                <ChevronLeft size={18} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
