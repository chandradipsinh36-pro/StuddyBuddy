/* Reusable stub/placeholder for pages under construction */

import { Construction } from 'lucide-react';
import styles from './PageStubs.module.css';

interface StubProps { title: string; description?: string; }

export function PageStub({ title, description }: StubProps) {
  return (
    <div className={styles.stub}>
      <Construction size={48} className={styles.icon} />
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.desc}>{description}</p>}
      <div className={styles.badge}>🚧 Coming Soon</div>
    </div>
  );
}

// ===================== Public Stubs =====================
export function TutorsListPage()    { return <PageStub title="Browse Tutors" description="Find and connect with verified expert tutors." />; }
export function ResourcesListPage() { return <PageStub title="Browse Resources" description="Explore thousands of curated learning resources." />; }
export function PlaylistsListPage() { return <PageStub title="Learning Playlists" description="Structured playlists to guide your learning journey." />; }
export function PlaylistDetailPage(){ return <PageStub title="Playlist" description="View playlist resources and track your progress." />; }
export function StudyGroupsPage()   { return <PageStub title="Study Groups" description="Join or create study groups for collaborative learning." />; }
export function StudyGroupDetailPage() { return <PageStub title="Study Group" description="Collaborate with peers in this study group." />; }
export function NotFoundPage()      { return <PageStub title="404 — Page Not Found" description="The page you're looking for doesn't exist." />; }

// ===================== Student Stubs =====================
export function StudentProfilePage()  { return <PageStub title="My Profile" description="View and edit your student profile." />; }
export function StudentPurchasesPage(){ return <PageStub title="My Purchases" description="Access your purchased resources and playlists." />; }
export function StudentSavedPage()    { return <PageStub title="Saved" description="Your saved tutors, resources, and playlists." />; }
export function StudentSettingsPage() { return <PageStub title="Settings" description="Manage your account and preferences." />; }

// ===================== Tutor Stubs =====================
export function TutorAnalyticsPage()    { return <PageStub title="Analytics" description="View detailed analytics for your content and earnings." />; }
export function TutorEarningsPage()     { return <PageStub title="Earnings" description="Track your earnings, payouts, and transaction history." />; }
export function TutorResourcesPage()    { return <PageStub title="My Resources" description="Manage all your uploaded resources." />; }
export function TutorPlaylistsPage()    { return <PageStub title="My Playlists" description="Create and manage your learning playlists." />; }
export function TutorBundlesPage()      { return <PageStub title="Content Bundles" description="Package your resources into bundles for students." />; }
export function TutorReviewsPage()      { return <PageStub title="My Reviews" description="See what students say about your content." />; }
export function TutorProfileEditPage()  { return <PageStub title="Edit Profile" description="Update your tutor profile and teaching information." />; }
export function TutorSettingsPage()     { return <PageStub title="Settings" description="Manage your tutor account settings." />; }
export function TutorResourceCreatePage() { return <PageStub title="Upload Resource" description="Upload a new resource for your students." />; }
export function TutorResourceEditPage() { return <PageStub title="Edit Resource" description="Update resource details and settings." />; }
