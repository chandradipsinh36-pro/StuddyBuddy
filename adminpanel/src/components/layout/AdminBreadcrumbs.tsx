import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTES } from '../../constants';

interface Crumb {
  label: string;
  path?: string;
}

export const AdminBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const crumbs: Crumb[] = [{ label: 'Admin', path: ROUTES.DASHBOARD }];

  if (pathnames.length === 0) {
    crumbs.push({ label: 'Dashboard' });
  } else {
    let currentPath = '';
    pathnames.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathnames.length - 1;

      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === 'users') label = 'User Management';
      if (segment === 'tutors') label = 'Tutor Management';
      if (segment === 'applications') label = 'Applications';
      if (segment === 'courses') label = 'Course Management';
      if (segment === 'bundles') label = 'Bundle Management';
      if (segment === 'resources') label = 'Resource Management';
      if (segment === 'profile') label = 'Admin Profile';
      if (!isNaN(Number(segment))) label = `#${segment}`;

      crumbs.push({
        label,
        path: isLast ? undefined : currentPath,
      });
    });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-gray-500)',
      }}
    >
      <Link
        to={ROUTES.DASHBOARD}
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--color-gray-400)',
          transition: 'color var(--transition-fast)',
        }}
        title="Dashboard"
      >
        <Home size={14} />
      </Link>

      {crumbs.slice(1).map((crumb, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={12} style={{ color: 'var(--color-gray-400)' }} />
          {crumb.path ? (
            <Link
              to={crumb.path}
              style={{
                color: 'var(--color-gray-600)',
                fontWeight: 500,
              }}
            >
              {crumb.label}
            </Link>
          ) : (
            <span style={{ color: 'var(--color-gray-900)', fontWeight: 600 }}>
              {crumb.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
