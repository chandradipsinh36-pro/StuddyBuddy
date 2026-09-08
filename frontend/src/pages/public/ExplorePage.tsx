import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { tutorService } from '../../services/tutorService';
import { ResourceCard } from '../../components/shared/ResourceCard';
import { TutorCard } from '../../components/shared/TutorCard';
import { SearchBar } from '../../components/ui/SearchBar/SearchBar';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { Tabs } from '../../components/ui/Tabs/Tabs';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState/ErrorState';
import type { Resource, Tutor } from '../../types';
import { SUBJECTS, RESOURCE_TYPES, DIFFICULTY_LEVELS } from '../../constants';
import styles from './ExplorePage.module.css';

const SUBJECT_OPTIONS = [{ value: '', label: 'All Subjects' }, ...SUBJECTS.map(s => ({ value: s, label: s }))];
const TYPE_OPTIONS = [{ value: '', label: 'All Types' }, ...RESOURCE_TYPES.map(t => ({ value: t.value, label: t.label }))];
const DIFFICULTY_OPTIONS = [{ value: '', label: 'All Levels' }, ...DIFFICULTY_LEVELS.map(d => ({ value: d.value, label: d.label }))];
const ACCESS_OPTIONS = [{ value: '', label: 'Free & Premium' }, { value: 'free', label: 'Free Only' }, { value: 'premium', label: 'Premium Only' }];

export function ExplorePage() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [tab, setTab] = useState(params.get('tab') || 'all');
  const [subject, setSubject] = useState(params.get('subject') || '');
  const [type, setType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [accessType, setAccessType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [resources, setResources] = useState<Resource[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      if (tab === 'tutors') {
        const data = await tutorService.getTutors({ search, subject });
        setTutors(data.data);
      } else if (tab === 'resources' || tab === 'all') {
        const data = await resourceService.getResources({
          search, subject,
          type: type as any,
          difficulty: difficulty as any,
          accessType: accessType as any,
        });
        setResources(data.data);
        if (tab === 'all') {
          const tutorData = await tutorService.getTutors({ search, subject });
          setTutors(tutorData.data.slice(0, 3));
        }
      }
    } catch {
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [search, tab, subject, type, difficulty, accessType]);

  const clearFilters = () => {
    setSubject(''); setType(''); setDifficulty(''); setAccessType('');
  };
  const hasFilters = subject || type || difficulty || accessType;

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'resources', label: `Resources` },
    { id: 'tutors', label: 'Tutors' },
    { id: 'playlists', label: 'Playlists' },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.container}>
          <h1 className={styles.title}>Explore</h1>
          <p className={styles.subtitle}>Search across tutors, resources, playlists, and more.</p>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search tutors, subjects, resources..."
            size="lg"
            className={styles.searchBar}
          />
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.toolbar}>
          <Tabs tabs={tabs} defaultTab={tab} onChange={setTab} />
          <button className={styles.filterBtn} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={16} />
            Filters
            {hasFilters && <span className={styles.filterCount}>!</span>}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={styles.filters}>
            <Select
              label="Subject"
              options={SUBJECT_OPTIONS}
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
            {tab !== 'tutors' && (
              <>
                <Select label="Type" options={TYPE_OPTIONS} value={type} onChange={e => setType(e.target.value)} />
                <Select label="Difficulty" options={DIFFICULTY_OPTIONS} value={difficulty} onChange={e => setDifficulty(e.target.value)} />
                <Select label="Access" options={ACCESS_OPTIONS} value={accessType} onChange={e => setAccessType(e.target.value)} />
              </>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" leftIcon={<X size={14} />} onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Results */}
        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : loading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {(tab === 'all' || tab === 'tutors') && tutors.length > 0 && (
              <div className={styles.section}>
                {tab === 'all' && <h2 className={styles.sectionTitle}>Tutors</h2>}
                <div className={styles.tutorGrid}>
                  {tutors.map(t => <TutorCard key={t.id} tutor={t} />)}
                </div>
              </div>
            )}
            {(tab === 'all' || tab === 'resources') && (
              <div className={styles.section}>
                {tab === 'all' && <h2 className={styles.sectionTitle}>Resources</h2>}
                {resources.length > 0 ? (
                  <div className={styles.resourceGrid}>
                    {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
                  </div>
                ) : (
                  <EmptyState
                    title="No resources found"
                    description="Try adjusting your search or filters."
                    action={{ label: 'Clear filters', onClick: () => { setSearch(''); clearFilters(); } }}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
