import { useState, useEffect } from 'react';
import { resourceService } from '../../services/resourceService';
import { ResourceCard } from '../../components/shared/ResourceCard';
import { SearchBar } from '../../components/ui/SearchBar/SearchBar';
import { Select } from '../../components/ui/Select/Select';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import type { Resource, ResourceType, DifficultyLevel, ResourceAccessType } from '../../types';
import { SUBJECTS, RESOURCE_TYPES, DIFFICULTY_LEVELS } from '../../constants';
import styles from './ResourcesListPage.module.css';

const TYPE_OPTIONS = [{ value: '', label: 'All Media Types' }, ...RESOURCE_TYPES.map(t => ({ value: t.value, label: t.label }))];
const DIFFICULTY_OPTIONS = [{ value: '', label: 'All Difficulties' }, ...DIFFICULTY_LEVELS.map(d => ({ value: d.value, label: d.label }))];
const ACCESS_OPTIONS = [
  { value: '', label: 'Free & Premium' },
  { value: 'free', label: 'Free Only' },
  { value: 'premium', label: 'Premium Only' },
];

export function ResourcesListPage() {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [type, setType] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [accessType, setAccessType] = useState<string>('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await resourceService.getResources({
          search,
          subject: selectedSubject || undefined,
          type: (type || undefined) as ResourceType | undefined,
          difficulty: (difficulty || undefined) as DifficultyLevel | undefined,
          accessType: (accessType || undefined) as ResourceAccessType | undefined,
        });
        setResources(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [search, selectedSubject, type, difficulty, accessType]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Explore Study Resources</h1>
        <p className={styles.subtitle}>
          Curated notes, practice tests, video lectures, and cheatsheets verified by academic educators.
        </p>
      </div>

      <div className={styles.searchSection}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search resources by title, subject, or keywords (e.g. Differentiation, JEE, Python)..."
        />
      </div>

      {/* Subject Filter Pills */}
      <div className={styles.filterChips}>
        <button
          className={`${styles.chip} ${selectedSubject === '' ? styles.chipActive : ''}`}
          onClick={() => setSelectedSubject('')}
        >
          All Subjects
        </button>
        {SUBJECTS.map(subj => (
          <button
            key={subj}
            className={`${styles.chip} ${selectedSubject === subj ? styles.chipActive : ''}`}
            onClick={() => setSelectedSubject(subj)}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Secondary Filters */}
      <div className={styles.filterBar}>
        <Select
          label="Resource Type"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <Select
          label="Difficulty Level"
          options={DIFFICULTY_OPTIONS}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        />
        <Select
          label="Access Type"
          options={ACCESS_OPTIONS}
          value={accessType}
          onChange={(e) => setAccessType(e.target.value)}
        />
      </div>

      <div className={styles.countInfo}>
        Found {resources.length} verified learning resources
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="Try relaxing your filters or searching for different topics."
          action={{
            label: "Clear Filters",
            onClick: () => {
              setSearch('');
              setSelectedSubject('');
              setType('');
              setDifficulty('');
              setAccessType('');
            },
          }}
        />
      ) : (
        <div className={styles.grid}>
          {resources.map(res => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      )}
    </div>
  );
}
