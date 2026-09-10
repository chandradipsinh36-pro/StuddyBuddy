import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';

// Auth
import { AdminLoginPage } from '../pages/auth/AdminLoginPage';

// Pages
import { AdminDashboardPage } from '../pages/dashboard/AdminDashboardPage';
import { UsersListPage } from '../pages/users/UsersListPage';
import { UserDetailPage } from '../pages/users/UserDetailPage';
import { TutorsListPage } from '../pages/tutors/TutorsListPage';
import { TutorApplicationsPage } from '../pages/tutors/TutorApplicationsPage';
import { TutorApplicationReviewPage } from '../pages/tutors/TutorApplicationReviewPage';
import { TutorProfilePage } from '../pages/tutors/TutorProfilePage';
import { AdminProfilePage } from '../pages/profile/AdminProfilePage';
import { AdminCoursesPage } from '../pages/courses/AdminCoursesPage';
import { AdminBundlesPage } from '../pages/bundles/AdminBundlesPage';
import { AdminResourcesPage } from '../pages/resources/AdminResourcesPage';
import { ROUTES } from '../constants';

export const router = createBrowserRouter([
  // Public Admin Login
  {
    path: ROUTES.LOGIN,
    element: <AdminLoginPage />,
  },

  // Protected Admin Console Layout
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'users',
        element: <UsersListPage />,
      },
      {
        path: 'users/:id',
        element: <UserDetailPage />,
      },
      {
        path: 'tutors',
        element: <TutorsListPage />,
      },
      {
        path: 'tutors/applications',
        element: <TutorApplicationsPage />,
      },
      {
        path: 'tutors/applications/:id',
        element: <TutorApplicationReviewPage />,
      },
      {
        path: 'tutors/:id',
        element: <TutorProfilePage />,
      },
      {
        path: 'courses',
        element: <AdminCoursesPage />,
      },
      {
        path: 'bundles',
        element: <AdminBundlesPage />,
      },
      {
        path: 'resources',
        element: <AdminResourcesPage />,
      },
      {
        path: 'profile',
        element: <AdminProfilePage />,
      },
    ],
  },

  // Catch all unknown routes -> Redirect to dashboard
  {
    path: '*',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
]);
