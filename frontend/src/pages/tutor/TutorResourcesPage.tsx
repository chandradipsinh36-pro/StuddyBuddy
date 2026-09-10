import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { resourceService } from '../../services/resourceService';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { ROUTES } from '../../constants';
import type { Resource } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorResourcesPage.module.css';

export function TutorResourcesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTutorResources = async () => {
    try {
      const res = await resourceService.getMyResources();
      const rawList = res.data || [];
      const ownResources = rawList.filter(r => {
        const uploaderId = Number(r.uploadedBy || (r.uploader as any)?.id || 0);
        return !user?.id || !uploaderId || uploaderId === user.id;
      });
      setResources(ownResources);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorResources();
  }, [user?.id]);

  const handleDelete = async (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await resourceService.deleteResource(id);
        setResources(prev => prev.filter(r => (r.id || (r as any).resourceId) !== id));
        toast.success('Resource deleted successfully.');
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || 'Failed to delete resource.');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-gray-500)' }}>
          Loading your teaching materials...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Uploaded Resources</h1>
          <p className={styles.subtitle}>
            Upload and manage study notes, slide decks, video tutorials, and test papers to attach to courses and bundles.
          </p>
        </div>
        <Link to={ROUTES.TUTOR_RESOURCE_CREATE}>
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Upload New Resource
          </Button>
        </Link>
      </div>

      {resources.length === 0 ? (
        <EmptyState
          title="No resources uploaded yet"
          description="Upload your study materials, lecture slides, and practice papers. Once uploaded, you can attach them to courses or assemble them into paid study bundles."
          action={{
            label: 'Upload First Resource',
            onClick: () => navigate(ROUTES.TUTOR_RESOURCE_CREATE),
          }}
        />
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Material</th>
                <th>Category</th>
                <th>Format</th>
                <th>Price</th>
                <th>Status</th>
                <th>Views</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(r => {
                const resId = Number(r.id || (r as any).resourceId || 0);
                const title = r.title || (r as any).filename || 'Teaching Resource';
                const fileUrl = (r as any).fileUrl || (r as any).url;

                return (
                  <tr key={resId}>
                    <td>
                      <div className={styles.resourceCell}>
                        {r.thumbnailUrl && <img src={r.thumbnailUrl} alt={title} className={styles.thumb} />}
                        <div>
                          <strong>{title}</strong>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                            {r.subject || 'Study Material'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{r.category || 'General'}</td>
                    <td><Badge variant="outline">{(r.type || r.fileType || 'pdf').toUpperCase()}</Badge></td>
                    <td>
                      {Number(r.price) === 0 || r.accessType === 'free' ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Free</span>
                      ) : (
                        <strong>₹{Number(r.price).toLocaleString('en-IN')}</strong>
                      )}
                    </td>
                    <td>
                      <Badge variant={r.status === 'published' ? 'success' : r.status === 'under_review' ? 'warning' : 'default'}>
                        {(r.status || 'published').replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td>{(r.viewCount ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actions}>
                        {fileUrl && (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" title="Preview document / video">
                              <ExternalLink size={14} />
                            </Button>
                          </a>
                        )}
                        <Link to={ROUTES.TUTOR_RESOURCE_EDIT(resId)}>
                          <Button variant="ghost" size="sm" title="Edit resource">
                            <Edit2 size={14} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete resource"
                          onClick={() => handleDelete(resId, title)}
                        >
                          <Trash2 size={14} color="var(--color-error)" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

