import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Menu,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminDashboardService } from '../../services/adminDashboardService';
import type { AdminNotification } from '../../types/admin';
import { ROUTES } from '../../constants';

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
  pageTitle?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileMenu, pageTitle }) => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminDashboardService.getNotifications().then(setNotifications);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (item: AdminNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setShowNotifications(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-header)',
      }}
    >
      {/* Left side: Hamburger (mobile), Breadcrumbs, Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <button
          onClick={onOpenMobileMenu}
          className="btn btn-ghost btn-icon-only"
          style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <AdminBreadcrumbs />
          {pageTitle && (
            <h1
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                color: 'var(--color-gray-900)',
                marginTop: '2px',
              }}
            >
              {pageTitle}
            </h1>
          )}
        </div>
      </div>

      {/* Right side: Notifications & Profile Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {/* Notification Bell with Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-ghost btn-icon-only"
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-gray-600)',
            }}
            aria-label="View notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-danger)',
                  boxShadow: '0 0 0 2px var(--color-white)',
                }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="admin-card animate-fade-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 320,
                padding: 'var(--space-3)',
                zIndex: 'var(--z-dropdown)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) var(--space-2) var(--space-3)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-900)' }}>
                  Notifications
                </div>
                {unreadCount > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                    {unreadCount} New
                  </span>
                )}
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto', marginTop: 'var(--space-2)' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-gray-400)', fontSize: 'var(--font-size-xs)' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: item.read ? 'transparent' : 'var(--color-primary-50)',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        transition: 'background-color var(--transition-fast)',
                        display: 'flex',
                        gap: 'var(--space-3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = item.read ? 'transparent' : 'var(--color-primary-50)';
                      }}
                    >
                      <div style={{ marginTop: 2, flexShrink: 0 }}>
                        {item.type === 'application' ? (
                          <AlertCircle size={16} color="var(--color-warning)" />
                        ) : item.type === 'user_status' ? (
                          <Info size={16} color="var(--color-primary-500)" />
                        ) : (
                          <CheckCircle2 size={16} color="var(--color-success)" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginTop: 2, lineHeight: 1.3 }}>
                          {item.message}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-gray-400)', marginTop: 4 }}>
                          {item.timestamp}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: showProfileMenu ? 'var(--color-gray-100)' : 'transparent',
              transition: 'background-color var(--transition-fast)',
              cursor: 'pointer',
            }}
            aria-label="Admin account menu"
          >
            <img
              src={adminUser?.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminChief'}
              alt={adminUser?.name || 'Admin'}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--color-primary-200)',
              }}
            />
            <div style={{ textAlign: 'left', display: window.innerWidth <= 640 ? 'none' : 'block' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-900)', lineHeight: 1.2 }}>
                {adminUser?.name || 'Admin Chief'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 2 }}>
                <span className="badge badge-admin" style={{ padding: '0.08rem 0.35rem', fontSize: '0.62rem' }}>
                  ADMINISTRATOR
                </span>
              </div>
            </div>
            <ChevronDown size={14} color="var(--color-gray-400)" />
          </button>

          {showProfileMenu && (
            <div
              className="admin-card animate-fade-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 220,
                padding: 'var(--space-2)',
                zIndex: 'var(--z-dropdown)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-1)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>Signed in as</div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-800)', wordBreak: 'break-all' }}>
                  {adminUser?.email}
                </div>
              </div>

              <Link
                to={ROUTES.PROFILE}
                onClick={() => setShowProfileMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-gray-700)',
                  fontSize: 'var(--font-size-sm)',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <UserIcon size={16} />
                <span>My Profile</span>
              </Link>

              <Link
                to={ROUTES.PROFILE}
                onClick={() => setShowProfileMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-gray-700)',
                  fontSize: 'var(--font-size-sm)',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Settings size={16} />
                <span>Account Settings</span>
              </Link>

              <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-1) 0' }} />

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
