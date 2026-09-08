import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { ROUTES } from '../../constants';
import type { Resource } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorResourcesPage.module.css';

export function TutorResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorResources = async () => {
      try {
        const data = await resourceService.getTutorResources(1);
        setResources(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutorResources();
  }, []);

  const handleDelete = (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}"?`)) {
      setResources(prev => prev.filter(r => r.id !== id));
      toast.success('Resource deleted.');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading teaching materials...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Uploaded Resources</h1>
          <p className={styles.subtitle}>
            Manage your study notes, video tutorials, practice tests, and worksheets.
          </p>
        </div>
        <Link to={ROUTES.TUTOR_RESOURCE_CREATE}>
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Upload New Resource
          </Button>
        </Link>
      </div>

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
              <th>Sales</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map(r => (
              <tr key={r.id}>
                <td>
                  <div className={styles.resourceCell}>
                    {r.thumbnailUrl && <img src={r.thumbnailUrl} alt={r.title} className={styles.thumb} />}
                    <div>
                      <strong>{r.title}</strong>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>{r.subject}</div>
                    </div>
                  </div>
                </td>
                <td>{r.category || 'General'}</td>
                <td><Badge variant="outline">{(r.type || r.fileType || 'pdf').toUpperCase()}</Badge></td>
                <td>{r.accessType === 'free' ? <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Free</span> : `₹${r.price}`}</td>
                <td>
                  <Badge variant={r.status === 'published' ? 'success' : r.status === 'under_review' ? 'warning' : 'default'}>
                    {(r.status || 'published').replace('_', ' ').toUpperCase()}
                  </Badge>
                </td>
                <td>{(r.viewCount ?? 0).toLocaleString()}</td>
                <td>{r.purchaseCount ?? 0}</td>
                <td>
                  <div className={styles.actions}>
                    <Link to={ROUTES.RESOURCE_DETAIL(r.id || r.resourceId || 1)}>
                      <Button variant="ghost" size="sm" aria-label="View resource">
                        <ExternalLink size={14} />
                      </Button>
                    </Link>
                    <Link to={ROUTES.TUTOR_RESOURCE_EDIT(r.id || r.resourceId || 1)}>
                      <Button variant="ghost" size="sm" aria-label="Edit resource">
                        <Edit2 size={14} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete resource"
                      onClick={() => handleDelete(r.id || r.resourceId || 1, r.title || r.filename || 'Resource')}
                    >
                      <Trash2 size={14} color="var(--color-error)" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
