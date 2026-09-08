import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import { StudentLayout, TutorLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from '../pages/auth/VerifyEmailPage';

// Public
import { LandingPage } from '../pages/public/LandingPage';
import { ExplorePage } from '../pages/public/ExplorePage';
import { TutorProfilePage } from '../pages/public/TutorProfilePage';
import { ResourceDetailPage } from '../pages/public/ResourceDetailPage';

// Student
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { AIAssistantPage } from '../pages/student/AIAssistant';

// Tutor
import { TutorDashboard } from '../pages/tutor/TutorDashboard';
import { TutorOnboarding } from '../pages/tutor/TutorOnboarding';

// Public
import { TutorsListPage } from '../pages/public/TutorsListPage';
import { ResourcesListPage } from '../pages/public/ResourcesListPage';
import { CoursesListPage } from '../pages/public/CoursesListPage';
import { CourseDetailPage } from '../pages/public/CourseDetailPage';
import { PlaylistsListPage } from '../pages/public/PlaylistsListPage';
import { PlaylistDetailPage } from '../pages/public/PlaylistDetailPage';
import { StudyGroupsPage } from '../pages/public/StudyGroupsPage';
import { StudyGroupDetailPage } from '../pages/public/StudyGroupDetailPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';

// Student
import { StudentProfilePage } from '../pages/student/StudentProfilePage';
import { StudentPurchasesPage } from '../pages/student/StudentPurchasesPage';
import { StudentSavedPage } from '../pages/student/StudentSavedPage';
import { StudentSettingsPage } from '../pages/student/StudentSettingsPage';

// Tutor
import { TutorAnalyticsPage } from '../pages/tutor/TutorAnalyticsPage';
import { TutorEarningsPage } from '../pages/tutor/TutorEarningsPage';
import { TutorResourcesPage } from '../pages/tutor/TutorResourcesPage';
import { TutorPlaylistsPage } from '../pages/tutor/TutorPlaylistsPage';
import { TutorBundlesPage } from '../pages/tutor/TutorBundlesPage';
import { TutorReviewsPage } from '../pages/tutor/TutorReviewsPage';
import { TutorProfileEditPage } from '../pages/tutor/TutorProfileEditPage';
import { TutorSettingsPage } from '../pages/tutor/TutorSettingsPage';
import { TutorCoursesPage } from '../pages/tutor/TutorCoursesPage';
import { TutorCourseCreatePage } from '../pages/tutor/TutorCourseCreatePage';
import { TutorResourceCreatePage } from '../pages/tutor/TutorResourceCreatePage';
import { TutorResourceEditPage } from '../pages/tutor/TutorResourceEditPage';

import { ROUTES } from '../constants';

const LoadingFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
    <div style={{ width: 36, height: 36, border: '3px solid #E5E7EB', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const router = createBrowserRouter([
  // ============ AUTH (standalone pages — no nav) ============
  { path: ROUTES.LOGIN,          element: <LoginPage /> },
  { path: ROUTES.REGISTER,       element: <RegisterPage /> },
  { path: ROUTES.VERIFY_EMAIL,   element: <VerifyEmailPage /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
  { path: ROUTES.RESET_PASSWORD,  element: <ResetPasswordPage /> },

  // ============ PUBLIC (Navbar + Footer) ============
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.HOME,         element: <LandingPage /> },
      { path: ROUTES.EXPLORE,      element: <ExplorePage /> },
      { path: ROUTES.TUTORS,       element: <TutorsListPage /> },
      { path: '/tutors/:id',       element: <TutorProfilePage /> },
      { path: ROUTES.COURSES,      element: <CoursesListPage /> },
      { path: '/courses/:id',      element: <CourseDetailPage /> },
      { path: ROUTES.RESOURCES,    element: <ResourcesListPage /> },
      { path: '/resources/:id',    element: <ResourceDetailPage /> },
      { path: ROUTES.PLAYLISTS,    element: <PlaylistsListPage /> },
      { path: '/playlists/:id',    element: <PlaylistDetailPage /> },
      { path: ROUTES.STUDY_GROUPS, element: <StudyGroupsPage /> },
      { path: '/study-groups/:id', element: <StudyGroupDetailPage /> },
    ],
  },

  // ============ STUDENT (Protected — requires login) ============
  {
    element: (
      <ProtectedRoute role="student">
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.STUDENT_DASHBOARD, element: <StudentDashboard /> },
      { path: ROUTES.STUDENT_PROFILE,   element: <StudentProfilePage /> },
      { path: ROUTES.STUDENT_PURCHASES, element: <StudentPurchasesPage /> },
      { path: ROUTES.STUDENT_SAVED,     element: <StudentSavedPage /> },
      { path: ROUTES.STUDENT_SETTINGS,  element: <StudentSettingsPage /> },
    ],
  },

  // AI route is accessible to both students and tutors (just protected)
  {
    path: ROUTES.AI,
    element: (
      <ProtectedRoute>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AIAssistantPage /> },
    ],
  },

  // ============ TUTOR (Protected — requires tutor role) ============
  {
    element: (
      <ProtectedRoute role="tutor">
        <TutorLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.TUTOR_DASHBOARD,        element: <TutorDashboard /> },
      { path: ROUTES.TUTOR_ONBOARDING,       element: <TutorOnboarding /> },
      { path: ROUTES.TUTOR_PROFILE_EDIT,     element: <TutorProfileEditPage /> },
      { path: ROUTES.TUTOR_COURSES,          element: <TutorCoursesPage /> },
      { path: ROUTES.TUTOR_COURSE_CREATE,    element: <TutorCourseCreatePage /> },
      { path: ROUTES.TUTOR_RESOURCES,        element: <TutorResourcesPage /> },
      { path: ROUTES.TUTOR_RESOURCE_CREATE,  element: <TutorResourceCreatePage /> },
      { path: '/tutor/resources/:id/edit',   element: <TutorResourceEditPage /> },
      { path: ROUTES.TUTOR_PLAYLISTS,        element: <TutorPlaylistsPage /> },
      { path: ROUTES.TUTOR_BUNDLES,          element: <TutorBundlesPage /> },
      { path: ROUTES.TUTOR_EARNINGS,         element: <TutorEarningsPage /> },
      { path: ROUTES.TUTOR_ANALYTICS,        element: <TutorAnalyticsPage /> },
      { path: ROUTES.TUTOR_REVIEWS,          element: <TutorReviewsPage /> },
      { path: ROUTES.TUTOR_SETTINGS,         element: <TutorSettingsPage /> },
    ],
  },

  // Redirect /dashboard to appropriate dashboard based on login
  { path: '/dashboard', element: <Navigate to={ROUTES.STUDENT_DASHBOARD} replace /> },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
