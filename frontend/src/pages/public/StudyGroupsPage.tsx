import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { GroupCard } from '../../components/shared/GroupCard';
import { SearchBar } from '../../components/ui/SearchBar/SearchBar';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { Modal } from '../../components/ui/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import type { StudyGroup } from '../../types';
import { SUBJECTS } from '../../constants';
import toast from 'react-hot-toast';
import styles from './StudyGroupsPage.module.css';

const SUBJECT_OPTIONS = [{ value: '', label: 'All Disciplines' }, ...SUBJECTS.map(s => ({ value: s, label: s }))];

export function StudyGroupsPage() {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState(SUBJECTS[0]);
  const [newGroupDesc, setNewGroupDesc] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await groupService.getGroups({
          search: search || undefined,
          subject: subject || undefined,
        });
        setGroups(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [search, subject]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name.');
      return;
    }

    try {
      const created = await groupService.createGroup({
        name: newGroupName.trim(),
      });
      setGroups(prev => [created, ...prev]);
      toast.success(`Study group "${newGroupName}" created successfully!`);
      setCreateModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create study group');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Collaborative Study Groups</h1>
          <p className={styles.subtitle}>
            Join active peer study communities, share exam notes, and solve doubts together in real time.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Study Group
        </Button>
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search study groups by topic or name (e.g. JEE, FAANG, Mathematics)..."
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
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          title="No study groups found"
          description="Be the first to create a study group for this topic!"
          action={{
            label: "Create Study Group",
            onClick: () => setCreateModalOpen(true),
          }}
        />
      ) : (
        <div className={styles.grid}>
          {groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Start a New Study Group"
      >
        <form onSubmit={handleCreateGroup} className={styles.modalForm}>
          <Input
            label="Group Name"
            placeholder="e.g. Organic Chemistry Study Lounge"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
          />
          <Select
            label="Primary Subject"
            options={SUBJECTS.map(s => ({ value: s, label: s }))}
            value={newGroupSubject}
            onChange={(e) => setNewGroupSubject(e.target.value)}
          />
          <Textarea
            label="Description & Goal"
            placeholder="Describe who this group is for and what you plan to learn or prepare for..."
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            rows={3}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Launch Group
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
