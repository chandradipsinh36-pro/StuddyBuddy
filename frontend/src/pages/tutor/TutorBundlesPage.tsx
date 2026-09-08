import { useState } from 'react';
import { Plus, Package, ShoppingBag } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Modal } from '../../components/ui/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { MOCK_RESOURCES } from '../../mock/data';
import type { Bundle } from '../../types';
import toast from 'react-hot-toast';
import styles from './TutorBundlesPage.module.css';

const INITIAL_BUNDLES: Bundle[] = [
  {
    id: 1,
    tutorId: 1,
    name: 'Calculus & Statistics Complete Exam Pack',
    description: 'Bundle containing complete calculus theory notes and the 50-question probability & statistics practice test.',
    resources: [MOCK_RESOURCES[0], MOCK_RESOURCES[3]],
    originalPrice: 498,
    discountPercent: 20,
    finalPrice: 399,
    isPublished: true,
    purchaseCount: 84,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 2,
    tutorId: 1,
    name: 'University Mathematics Foundation Bundle',
    description: 'All differentiation, integration, and linear algebra cheatsheets and solved problem sets.',
    resources: [MOCK_RESOURCES[0]],
    originalPrice: 299,
    discountPercent: 15,
    finalPrice: 254,
    isPublished: true,
    purchaseCount: 42,
    createdAt: '2026-08-15T00:00:00Z',
  },
];

export function TutorBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>(INITIAL_BUNDLES);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [bundleName, setBundleName] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [originalPrice, setOriginalPrice] = useState('499');
  const [discount, setDiscount] = useState('25');

  const handleCreateBundle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim()) {
      toast.error('Please enter a bundle name.');
      return;
    }

    const orig = parseFloat(originalPrice) || 400;
    const disc = parseFloat(discount) || 20;
    const finalP = Math.round(orig * (1 - disc / 100));

    const newBundle: Bundle = {
      id: Date.now(),
      tutorId: 1,
      name: bundleName,
      description: bundleDesc || 'Curated package of verified study materials at a special discounted price.',
      resources: [MOCK_RESOURCES[0], MOCK_RESOURCES[2]],
      originalPrice: orig,
      discountPercent: disc,
      finalPrice: finalP,
      isPublished: true,
      purchaseCount: 0,
      createdAt: new Date().toISOString(),
    };

    setBundles(prev => [newBundle, ...prev]);
    toast.success(`Bundle "${bundleName}" created!`);
    setModalOpen(false);
    setBundleName('');
    setBundleDesc('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Resource Bundles & Packages</h1>
          <p className={styles.subtitle}>
            Offer multi-resource discounts to increase your average order value and help students save.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setModalOpen(true)}
        >
          Create New Bundle
        </Button>
      </div>

      <div className={styles.grid}>
        {bundles.map(b => (
          <div key={b.id} className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant="primary">
                <Package size={12} style={{ marginRight: 4 }} />
                {b.resources?.length ?? b.bundleItems?.length ?? 0} Materials Included
              </Badge>
              <Badge variant="success">{b.discountPercent ?? 20}% OFF</Badge>
            </div>

            <h2 className={styles.bundleName}>{b.name || b.title}</h2>
            <p className={styles.bundleDesc}>{b.description}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
              <ShoppingBag size={14} />
              <span>{b.purchaseCount} students bought this package</span>
            </div>

            <div className={styles.pricingRow}>
              <span className={styles.originalPrice}>₹{b.originalPrice}</span>
              <span className={styles.finalPrice}>₹{b.finalPrice}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Teaching Bundle"
      >
        <form onSubmit={handleCreateBundle} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Bundle Name *"
            placeholder="e.g. Complete JEE Physics & Chemistry Crash Course"
            value={bundleName}
            onChange={(e) => setBundleName(e.target.value)}
            required
          />

          <Textarea
            label="Bundle Description *"
            placeholder="Highlight the benefits of buying these resources together..."
            value={bundleDesc}
            onChange={(e) => setBundleDesc(e.target.value)}
            rows={3}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              label="Standard Price (₹) *"
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              required
            />
            <Input
              label="Discount Percent (%) *"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Publish Bundle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
