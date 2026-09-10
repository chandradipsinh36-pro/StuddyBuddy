import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, Bell, Search, Menu, X, ChevronDown,
  LayoutDashboard, User, LogOut, Settings, ShoppingBag,
  Bookmark, Star, Users, Package, FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar/Avatar';
import { NotificationItem } from '../shared/NotificationItem';
import { notificationService } from '../../services/notificationService';
import { ROUTES } from '../../constants';
import type { Notification } from '../../types';
import styles from './Navbar.module.css';

const PUBLIC_NAV = [
  { label: 'Explore', to: ROUTES.EXPLORE },
  { label: 'Courses', to: ROUTES.COURSES },
  { label: 'Bundles', to: ROUTES.BUNDLES },
  { label: 'Tutors', to: ROUTES.TUTORS },
];

const STUDENT_NAV = [
  { label: 'Dashboard', to: ROUTES.STUDENT_DASHBOARD, icon: <LayoutDashboard size={16} /> },
  { label: 'Courses', to: ROUTES.COURSES, icon: <BookOpen size={16} /> },
  { label: 'Bundles', to: ROUTES.BUNDLES, icon: <Package size={16} /> },
  { label: 'Tutors', to: ROUTES.TUTORS, icon: <Users size={16} /> },
];

const TUTOR_NAV = [
  { label: 'Dashboard', to: ROUTES.TUTOR_DASHBOARD, icon: <LayoutDashboard size={16} /> },
  { label: 'My Courses', to: ROUTES.TUTOR_COURSES, icon: <BookOpen size={16} /> },
  { label: 'My Resources', to: ROUTES.TUTOR_RESOURCES, icon: <FileText size={16} /> },
  { label: 'Bundles', to: ROUTES.TUTOR_BUNDLES, icon: <Package size={16} /> },
  { label: 'Earnings', to: ROUTES.TUTOR_EARNINGS, icon: <Star size={16} /> },
  { label: 'Analytics', to: ROUTES.TUTOR_ANALYTICS, icon: <Star size={16} /> },
];

export function Navbar() {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const navItems = !isAuthenticated
    ? PUBLIC_NAV
    : role === 'tutor' ? TUTOR_NAV : STUDENT_NAV;

  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getNotifications().then(setNotifications).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
    setProfileOpen(false);
  };

  const handleNotificationClick = (notif: Notification) => {
    notificationService.markRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Link to={ROUTES.HOME} className={styles.logo}>
            <BookOpen size={24} className={styles.logoIcon} />
            <span className={styles.logoText}>StudyBuddy</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className={styles.center}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className={styles.right}>
          {isAuthenticated ? (
            <>
              <Link to={ROUTES.EXPLORE} className={styles.iconBtn} aria-label="Search">
                <Search size={20} />
              </Link>

              {/* Notification Bell Dropdown */}
              <div ref={notifRef} className={styles.notifWrapper}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className={styles.notifDot} />}
                </button>

                {notifOpen && (
                  <div className={styles.notifDropdown}>
                    <div className={styles.notifHeader}>
                      <span className={styles.notifTitle}>Notifications ({unreadCount} new)</span>
                      {unreadCount > 0 && (
                        <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className={styles.notifList}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-xs)' }}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => (
                          <NotificationItem
                            key={n.id}
                            notification={n}
                            onClick={handleNotificationClick}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div ref={profileRef} className={styles.profileWrapper}>
                <button
                  className={styles.profileBtn}
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                >
                  <Avatar src={user?.avatarUrl || user?.profilePic || undefined} name={user?.name ?? 'User'} size="sm" />
                  <span className={styles.profileName}>{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`${styles.chevron} ${profileOpen ? styles.chevronOpen : ''}`} />
                </button>

                {profileOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownUser}>
                      <Avatar src={user?.avatarUrl || user?.profilePic || undefined} name={user?.name ?? 'User'} size="md" />
                      <div>
                        <div className={styles.dropdownName}>{user?.name}</div>
                        <div className={styles.dropdownEmail}>{user?.email}</div>
                        <div className={styles.dropdownRole}>{role === 'tutor' ? '👨‍🏫 Tutor' : '🎓 Student'}</div>
                      </div>
                    </div>
                    <hr className={styles.dropdownDivider} />
                    {role === 'student' && (
                      <>
                        <Link to={ROUTES.STUDENT_DASHBOARD} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link to={ROUTES.STUDENT_PROFILE} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <User size={16} /> My Profile
                        </Link>
                        <Link to={ROUTES.STUDENT_PURCHASES} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <ShoppingBag size={16} /> My Purchases
                        </Link>
                        <Link to={ROUTES.STUDENT_SAVED} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <Bookmark size={16} /> Saved
                        </Link>
                        <Link to={ROUTES.STUDENT_SETTINGS} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <Settings size={16} /> Settings
                        </Link>
                      </>
                    )}
                    {role === 'tutor' && (
                      <>
                        <Link to={ROUTES.TUTOR_DASHBOARD} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link to={ROUTES.TUTOR_COURSES} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <BookOpen size={16} /> My Courses
                        </Link>
                        <Link to={ROUTES.TUTOR_RESOURCES} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <FileText size={16} /> My Resources
                        </Link>
                        <Link to={ROUTES.TUTOR_BUNDLES} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <Package size={16} /> My Bundles
                        </Link>
                        <Link to={ROUTES.TUTOR_PROFILE_EDIT} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <User size={16} /> My Profile
                        </Link>
                        <Link to={ROUTES.TUTOR_EARNINGS} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <Star size={16} /> Earnings
                        </Link>
                        <Link to={ROUTES.TUTOR_SETTINGS} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                          <Settings size={16} /> Settings
                        </Link>
                      </>
                    )}
                    <hr className={styles.dropdownDivider} />
                    <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleLogout}>
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className={styles.loginBtn}>Log in</Link>
              <Link to={ROUTES.REGISTER} className={styles.registerBtn}>Get Started</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {'icon' in item && item.icon}
              {item.label}
            </NavLink>
          ))}
          <hr className={styles.mobileDivider} />
          {isAuthenticated ? (
            <button className={`${styles.mobileLink} ${styles.mobileLinkDanger}`} onClick={handleLogout}>
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link to={ROUTES.REGISTER} className={`${styles.mobileLink} ${styles.mobileLinkPrimary}`} onClick={() => setMobileOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
