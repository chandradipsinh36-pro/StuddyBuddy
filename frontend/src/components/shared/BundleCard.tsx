import React from 'react';
import { Link } from 'react-router-dom';
import { Package, FileText, Image as ImageIcon, Video, ArrowRight, Tag, Layers, CheckCircle, Lock } from 'lucide-react';
import type { Bundle } from '../../types';
import { Avatar } from '../ui/Avatar/Avatar';
import styles from './BundleCard.module.css';

interface BundleCardProps {
  bundle: Bundle;
  isOwned?: boolean;
  onViewDetails?: (bundle: Bundle) => void;
}

export const BundleCard: React.FC<BundleCardProps> = ({ bundle, isOwned, onViewDetails }) => {
  const bundleId = bundle.id || bundle.bundleId || 0;
  const title = bundle.name || bundle.title || 'Curated Study Bundle';
  const desc = bundle.description || 'Comprehensive learning package with curated notes and materials.';
  const tutorName = bundle.tutor?.name || 'Verified Tutor';
  const tutorAvatar = bundle.tutor?.avatarUrl || bundle.tutor?.profilePic;

  const rawItems = bundle.resources || (bundle.bundleItems || []).map((bi: any) => bi.resource).filter(Boolean) || [];
  const itemCount = rawItems.length;

  const priceNum = Number(bundle.price || bundle.finalPrice || 0);
  const origPrice = Number(bundle.originalPrice || (priceNum > 0 ? Math.round(priceNum / 0.75) : 0));
  const hasDiscount = origPrice > priceNum && priceNum > 0;
  const discountPercent = bundle.discountPercent ?? (hasDiscount ? Math.round(((origPrice - priceNum) / origPrice) * 100) : 0);

  const getFileIcon = (fileType?: string) => {
    const t = (fileType || '').toLowerCase();
    if (t.includes('pdf')) return <FileText size={13} className={styles.materialIcon} />;
    if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <ImageIcon size={13} className={styles.materialIcon} />;
    if (t.includes('video') || t.includes('mp4')) return <Video size={13} className={styles.materialIcon} />;
    return <FileText size={13} className={styles.materialIcon} />;
  };

  const handleAction = () => {
    if (onViewDetails) {
      onViewDetails(bundle);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.badgeStack}>
          {isOwned ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
            }}>
              ✓ Owned
            </span>
          ) : (
            <span className={styles.bundleBadge}>
              <Package size={12} /> Bundle Pack
            </span>
          )}
          {hasDiscount && !isOwned && (
            <span className={styles.discountBadge}>
              <Tag size={11} /> {discountPercent}% OFF
            </span>
          )}
        </div>
        <span className={styles.itemCountBadge}>
          <Layers size={12} /> {itemCount} {itemCount === 1 ? 'Resource' : 'Resources'}
        </span>
      </div>

      <div className={styles.content}>
        <h3
          className={styles.title}
          onClick={handleAction}
          title="Click to view details"
        >
          {title}
        </h3>

        <p className={styles.desc}>{desc}</p>

        <div className={styles.tutorRow}>
          <Avatar src={tutorAvatar || undefined} name={tutorName} size="xs" />
          <span>By <span className={styles.tutorName}>{tutorName}</span></span>
        </div>

        {itemCount > 0 && (
          <div className={styles.materialsSection}>
            <div className={styles.materialsHeader}>
              {isOwned ? (
                <>
                  <CheckCircle size={12} color="#059669" />
                  <span style={{ color: '#059669', fontWeight: 700 }}>Unlocked materials:</span>
                </>
              ) : (
                <>
                  <Lock size={12} color="#dc2626" />
                  <span>Included materials (Locked):</span>
                </>
              )}
            </div>
            <div className={styles.materialsList}>
              {rawItems.slice(0, 3).map((res: any, idx: number) => (
                <div key={res?.id || res?.resourceId || idx} className={styles.materialItem}>
                  {getFileIcon(res?.fileType || res?.type)}
                  <span className={styles.materialTitle}>
                    {res?.title || res?.filename || `Resource #${idx + 1}`}
                  </span>
                </div>
              ))}
              {itemCount > 3 && (
                <span className={styles.materialMore}>
                  +{itemCount - 3} more items included
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.priceCol}>
          {hasDiscount && (
            <span className={styles.originalPrice}>₹{origPrice.toLocaleString('en-IN')}</span>
          )}
          {priceNum === 0 ? (
            <span className={styles.freePrice}>Free</span>
          ) : (
            <span className={styles.finalPrice}>₹{priceNum.toLocaleString('en-IN')}</span>
          )}
        </div>

        {onViewDetails ? (
          <button
            type="button"
            className={styles.cardActionBtn}
            onClick={handleAction}
          >
            <span>View Bundle</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <Link to={`/bundles/${bundleId}`} className={styles.cardActionBtn}>
            <span>View Bundle</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
};
