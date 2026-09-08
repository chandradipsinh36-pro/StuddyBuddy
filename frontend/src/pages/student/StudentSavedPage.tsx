import { useState } from 'react';
import { ResourceCard } from '../../components/shared/ResourceCard';
import { TutorCard } from '../../components/shared/TutorCard';
import { PlaylistCard } from '../../components/shared/PlaylistCard';
import { Tabs } from '../../components/ui/Tabs/Tabs';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { MOCK_RESOURCES, MOCK_TUTORS, MOCK_PLAYLISTS } from '../../mock/data';
import { ROUTES } from '../../constants';
import toast from 'react-hot-toast';
import styles from './StudentSavedPage.module.css';

export function StudentSavedPage() {
  const [activeTab, setActiveTab] = useState('resources');
  const [savedResources, setSavedResources] = useState(MOCK_RESOURCES.slice(0, 3));
  const [savedTutors, setSavedTutors] = useState(MOCK_TUTORS.slice(0, 2));
  const [savedPlaylists] = useState(MOCK_PLAYLISTS.slice(0, 2));

  const handleUnsaveResource = (id: number) => {
    setSavedResources(prev => prev.filter(r => r.id !== id));
    toast.success('Removed from bookmarks.');
  };

  const handleUnsaveTutor = (id: number) => {
    setSavedTutors(prev => prev.filter(t => t.id !== id));
    toast.success('Tutor removed from saved list.');
  };

  const tabs = [
    { id: 'resources', label: `Saved Resources (${savedResources.length})` },
    { id: 'tutors', label: `Favorite Tutors (${savedTutors.length})` },
    { id: 'playlists', label: `Saved Playlists (${savedPlaylists.length})` },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Saved Bookmarks</h1>
        <p className={styles.subtitle}>
          Quickly revisit educational content, top tutors, and playlists you bookmarked.
        </p>
      </div>

      <div className={styles.tabsRow}>
        <Tabs tabs={tabs} defaultTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'resources' && (
        savedResources.length === 0 ? (
          <EmptyState
            title="No saved resources yet"
            description="Browse study materials and tap the bookmark icon to save them for later."
            action={{
              label: "Explore Resources",
              onClick: () => window.location.href = ROUTES.RESOURCES,
            }}
          />
        ) : (
          <div className={styles.grid}>
            {savedResources.map(r => (
              <ResourceCard
                key={r.id}
                resource={r}
                isSaved={true}
                onSave={handleUnsaveResource}
              />
            ))}
          </div>
        )
      )}

      {activeTab === 'tutors' && (
        savedTutors.length === 0 ? (
          <EmptyState
            title="No favorite tutors saved"
            description="Find verified tutors you enjoy learning from and bookmark them here."
            action={{
              label: "Browse Tutors",
              onClick: () => window.location.href = ROUTES.TUTORS,
            }}
          />
        ) : (
          <div className={styles.grid}>
            {savedTutors.map(t => (
              <TutorCard
                key={t.id}
                tutor={t}
                isSaved={true}
                onSave={handleUnsaveTutor}
              />
            ))}
          </div>
        )
      )}

      {activeTab === 'playlists' && (
        <div className={styles.grid}>
          {savedPlaylists.map(p => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </div>
      )}
    </div>
  );
}
