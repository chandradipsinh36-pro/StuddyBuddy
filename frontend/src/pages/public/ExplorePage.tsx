import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { bundleService } from '../../services/bundleService';
import { tutorService } from '../../services/tutorService';
import { BundleCard } from '../../components/shared/BundleCard';
import { TutorCard } from '../../components/shared/TutorCard';
import { SearchBar } from '../../components/ui/SearchBar/SearchBar';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { Tabs } from '../../components/ui/Tabs/Tabs';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState/ErrorState';
import type { Bundle, Tutor } from '../../types';
import { SUBJECTS } from '../../constants';
import styles from './ExplorePage.module.css';

const SUBJECT_OPTIONS = [{ value: '', label: 'All Subjects' }, ...SUBJECTS.map(s => ({ value: s, label: s }))];

export function ExplorePage() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [tab, setTab] = useState(params.get('tab') || 'all');
  const [subject, setSubject] = useState(params.get('subject') || '');
  const [showFilters, setShowFilters] = useState(false);

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      if (tab === 'tutors') {
        const data = await tutorService.getTutors({ search, subject });
        setTutors(data.data);
      } else if (tab === 'bundles' || tab === 'all') {
        const bundleData = await bundleService.getPublicBundles();
        const filtered = (bundleData || []).filter(b => {
          const q = search.toLowerCase().trim();
          if (!q) return true;
          return (b.name || b.title || '').toLowerCase().includes(q) ||
                 (b.description || '').toLowerCase().includes(q) ||
                 (b.tutor?.name || '').toLowerCase().includes(q);
        });
        setBundles(filtered);
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
  }, [search, tab, subject]);

  const clearFilters = () => {
    setSubject('');
  };
  const hasFilters = Boolean(subject);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'bundles', label: 'Study Bundles' },
    { id: 'tutors', label: 'Tutors' },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.container}>
          <h1 className={styles.title}>Explore</h1>
          <p className={styles.subtitle}>Search across expert tutors, study bundles, and learning packs.</p>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search bundles, subjects, or tutors..."
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
            {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {(tab === 'all' || tab === 'tutors') && tutors.length > 0 && (
              <div className={styles.section}>
                {tab === 'all' && <h2 className={styles.sectionTitle}>Featured Tutors</h2>}
                <div className={styles.tutorGrid}>
                  {tutors.map(t => <TutorCard key={t.id} tutor={t} />)}
                </div>
              </div>
            )}
            {(tab === 'all' || tab === 'bundles') && (
              <div className={styles.section}>
                {tab === 'all' && <h2 className={styles.sectionTitle}>Curated Study Bundles</h2>}
                {bundles.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {bundles.map(b => <BundleCard key={b.id || b.bundleId} bundle={b} />)}
                  </div>
                ) : (
                  <EmptyState
                    title="No study bundles found"
                    description="Try adjusting your search query or filters."
                    action={{ label: 'Clear search', onClick: () => { setSearch(''); clearFilters(); } }}
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
