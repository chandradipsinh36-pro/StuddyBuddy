import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { playlistService } from '../../services/playlistService';
import { PlaylistCard } from '../../components/shared/PlaylistCard';
import { Button } from '../../components/ui/Button/Button';
import { Modal } from '../../components/ui/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Select } from '../../components/ui/Select/Select';
import { SUBJECTS, DIFFICULTY_LEVELS } from '../../constants';
import type { Playlist } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorPlaylistsPage.module.css';

export function TutorPlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState('intermediate');

  const handleOpenCreateModal = () => {
    if (!user?.isVerified) {
      toast.error('Your tutor approval application is pending admin review. You can create playlists once approved.');
      return;
    }
    setCreateModalOpen(true);
  };

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await playlistService.getTutorPlaylists();
        setPlaylists(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isVerified) {
      toast.error('Your tutor approval application is pending admin review.');
      return;
    }
    if (!name.trim()) {
      toast.error('Please enter a playlist title.');
      return;
    }

    try {
      const created = await playlistService.createPlaylist({
        name,
        description,
        subject,
        difficulty: difficulty as any,
        resourceCount: 3,
        resources: [],
        isPublished: true,
        coverUrl: 'https://picsum.photos/seed/' + Math.random().toString() + '/400/240',
      });
      setPlaylists(prev => [created, ...prev]);
      toast.success(`Playlist "${name}" created!`);
      setCreateModalOpen(false);
      setName('');
      setDescription('');
    } catch {
      toast.error('Failed to create playlist.');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-gray-500)' }}>
          Loading playlists...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Curated Learning Playlists</h1>
          <p className={styles.subtitle}>
            Organize multiple resources into step-by-step learning tracks for students.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={handleOpenCreateModal}
        >
          Create Playlist
        </Button>
      </div>

      <div className={styles.grid}>
        {playlists.map(p => (
          <PlaylistCard key={p.id} playlist={p} />
        ))}
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Learning Playlist"
      >
        <form onSubmit={handleCreate} className={styles.modalForm}>
          <Input
            label="Playlist Name *"
            placeholder="e.g. Master Linear Algebra from Scratch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Textarea
            label="Curriculum Description *"
            placeholder="Explain what skills students will gain by following this track..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />

          <Select
            label="Subject *"
            options={SUBJECTS.map(s => ({ value: s, label: s }))}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Select
            label="Target Difficulty *"
            options={DIFFICULTY_LEVELS.map(d => ({ value: d.value, label: d.label }))}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save & Add Resources
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
