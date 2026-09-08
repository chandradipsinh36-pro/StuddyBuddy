import { useState, useEffect } from 'react';
import { tutorService } from '../../services/tutorService';
import { TutorCard } from '../../components/shared/TutorCard';
import { SearchBar } from '../../components/ui/SearchBar/SearchBar';
import { Select } from '../../components/ui/Select/Select';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import type { Tutor } from '../../types';
import { SUBJECTS } from '../../constants';
import styles from './TutorsListPage.module.css';

const SUBJECT_OPTIONS = [{ value: '', label: 'All Subjects' }, ...SUBJECTS.map(s => ({ value: s, label: s }))];

const RATING_OPTIONS = [
  { value: '', label: 'Any Rating' },
  { value: '4.5', label: '4.5 & above' },
  { value: '4.0', label: '4.0 & above' },
];

export function TutorsListPage() {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [minRating, setMinRating] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      try {
        const res = await tutorService.getTutors({
          search,
          subject,
          minRating: minRating ? parseFloat(minRating) : undefined,
          isVerified: verifiedOnly ? true : undefined,
        });
        setTutors(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, [search, subject, minRating, verifiedOnly]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Verified Expert Tutors</h1>
        <p className={styles.subtitle}>
          Learn 1-on-1 and explore study resources created by top educators, professors, and industry leaders.
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchRow}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search tutors by name, bio, subject, or skill (e.g. Calculus, Physics)..."
          />
        </div>

        <div className={styles.filtersGrid}>
          <Select
            label="Subject"
            options={SUBJECT_OPTIONS}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Select
            label="Minimum Rating"
            options={RATING_OPTIONS}
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          />
          <label className={styles.verifiedCheck}>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            <span>Show verified tutors only</span>
          </label>
        </div>
      </div>

      <div className={styles.statsBar}>
        Showing {tutors.length} verified educators
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : tutors.length === 0 ? (
        <EmptyState
          title="No tutors found"
          description="Try adjusting your subject filter or search terms."
          action={{
            label: "Clear Filters",
            onClick: () => { setSearch(''); setSubject(''); setMinRating(''); setVerifiedOnly(false); },
          }}
        />
      ) : (
        <div className={styles.grid}>
          {tutors.map(tutor => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </div>
  );
}
