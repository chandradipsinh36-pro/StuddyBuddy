import { useState, useEffect } from 'react';
import { playlistService } from '../../services/playlistService';
import { PlaylistCard } from '../../components/shared/PlaylistCard';
import { SearchBar } from '../../components/ui/SearchBar/SearchBar';
import { Select } from '../../components/ui/Select/Select';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import type { Playlist } from '../../types';
import { SUBJECTS, DIFFICULTY_LEVELS } from '../../constants';
import styles from './PlaylistsListPage.module.css';

const SUBJECT_OPTIONS = [{ value: '', label: 'All Subjects' }, ...SUBJECTS.map(s => ({ value: s, label: s }))];
const DIFFICULTY_OPTIONS = [{ value: '', label: 'All Difficulties' }, ...DIFFICULTY_LEVELS.map(d => ({ value: d.value, label: d.label }))];

export function PlaylistsListPage() {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      setLoading(true);
      try {
        const res = await playlistService.getPlaylists({
          search: search || undefined,
          subject: subject || undefined,
          difficulty: difficulty || undefined,
        });
        setPlaylists(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, [search, subject, difficulty]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Learning Playlists</h1>
        <p className={styles.subtitle}>
          Master complex topics step-by-step with structured sequences designed by certified educators.
        </p>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchWrap}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search learning paths and playlists..."
          />
        </div>
        <div className={styles.selectWrap}>
          <Select
            label="Subject"
            options={SUBJECT_OPTIONS}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className={styles.selectWrap}>
          <Select
            label="Difficulty"
            options={DIFFICULTY_OPTIONS}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <EmptyState
          title="No playlists found"
          description="Try selecting a different subject or clearing your search keywords."
          action={{
            label: "Clear Filters",
            onClick: () => { setSearch(''); setSubject(''); setDifficulty(''); },
          }}
        />
      ) : (
        <div className={styles.grid}>
          {playlists.map(pl => (
            <PlaylistCard key={pl.id} playlist={pl} />
          ))}
        </div>
      )}
    </div>
  );
}
