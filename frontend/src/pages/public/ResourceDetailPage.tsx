import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Unlock, Star, Eye, ShoppingCart, ArrowLeft, FileText, Video, Headphones, Image, Presentation, BookmarkPlus } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { reviewService } from '../../services/reviewService';
import { paymentService } from '../../services/paymentService';
import { enrollmentService } from '../../services/enrollmentService';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Badge } from '../../components/ui/Badge/Badge';
import { Rating } from '../../components/ui/Rating/Rating';
import { Button } from '../../components/ui/Button/Button';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState/ErrorState';
import { Modal } from '../../components/ui/Modal/Modal';
import { DocumentViewerModal } from '../../components/shared/DocumentViewerModal';
import type { Resource, Review } from '../../types';
import { parseVideoUrl } from '../../utils/videoUtils';
import { ROUTES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import styles from './ResourceDetailPage.module.css';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText size={20} />, image: <Image size={20} />,
  ppt: <Presentation size={20} />, audio: <Headphones size={20} />,
  youtube: <Video size={20} />, test_paper: <FileText size={20} />,
};

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF', image: 'Image', ppt: 'Presentation',
  audio: 'Audio', youtube: 'Video', test_paper: 'Test Paper',
};

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [resource, setResource] = useState<Resource | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [r, rv] = await Promise.all([
          resourceService.getResource(+id),
          reviewService.getResourceReviews(+id),
        ]);
        setResource(r);
        setReviews(rv);

        // Check if student has purchased this resource directly or via bundle/course
        if (isAuthenticated && user?.role === 'student') {
          const resId = Number(id);
          paymentService.getMyPayments().then((payments: any[]) => {
            const found = (payments || []).some((p: any) => 
              Number(p.resourceId) === resId || 
              Number(p.resource?.resourceId) === resId || 
              Number(p.resource?.id) === resId ||
              (p.bundle?.bundleItems || []).some((bi: any) => 
                Number(bi.resourceId || bi.resource?.resourceId || bi.resource?.id) === resId
              )
            );
            if (found) setHasPurchased(true);
          }).catch(() => {});

          if (r?.courseId) {
            enrollmentService.getMyEnrollments().then((enrollments: any[]) => {
              const enrolled = (enrollments || []).some((e: any) => 
                (Number(e.courseId) === Number(r.courseId) || Number((e as any).id) === Number(r.courseId)) && e.status === 'active'
              );
              if (enrolled) setHasPurchased(true);
            }).catch(() => {});
          }
        }
      } catch {
        setError('Resource not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isAuthenticated, user?.role]);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    setPurchasing(true);
    try {
      await resourceService.purchaseResource(resource!.id || resource!.resourceId || 0);
      setHasPurchased(true);
      toast.success('Resource unlocked! Enjoy learning.');
    } catch {
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const isAuthor = Boolean(user && (user.id === resource?.uploadedBy || user.id === resource?.tutorId));
  const isAdmin = (user?.role as string) === 'admin';
  const canAccess = !resource?.isLocked || resource?.accessType === 'free' || (resource as any)?.hasAccess || hasPurchased || isAuthor || isAdmin;

  if (loading) return (
    <div className={styles.page}><div className={styles.container}>
      <Skeleton height="400px" borderRadius="16px" />
    </div></div>
  );

  if (error || !resource) return <ErrorState message={error || 'Resource not found'} onRetry={() => navigate(-1)} />;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className={styles.layout}>
          {/* Left — Content */}
          <div className={styles.main}>
            {/* Thumbnail / Preview */}
            <div className={styles.previewWrapper}>
              {resource.thumbnailUrl && (
                <img src={resource.thumbnailUrl} alt={resource.title} className={styles.thumbnail} />
              )}
              {!canAccess && (
                <div className={styles.lockedOverlay}>
                  <Lock size={32} />
                  <p>This is premium content</p>
                  <span>Purchase to unlock full access</span>
                </div>
              )}
            </div>

            {/* If YouTube and accessible */}
            {canAccess && resource.type === 'youtube' && (resource.youtubeUrl || resource.fileUrl) && (() => {
              const videoInfo = parseVideoUrl(resource.youtubeUrl || resource.fileUrl);
              return (
                <div className={styles.videoWrapper}>
                  {videoInfo.type === 'direct' ? (
                    <video src={videoInfo.embedUrl} controls className={styles.video} />
                  ) : (
                    <iframe
                      src={videoInfo.embedUrl}
                      title={resource.title}
                      className={styles.video}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                </div>
              );
            })()}

            {/* Details */}
            <div className={styles.details}>
              <div className={styles.metaRow}>
                <Badge variant="outline">{resource.subject || 'General'}</Badge>
                <Badge variant={resource.difficulty === 'beginner' ? 'success' : resource.difficulty === 'advanced' ? 'error' : 'warning'}>
                  {resource.difficulty || 'All Levels'}
                </Badge>
                <Badge variant="default">
                  {TYPE_ICONS[(resource.type || resource.fileType || 'pdf') as keyof typeof TYPE_ICONS]} {TYPE_LABELS[(resource.type || resource.fileType || 'pdf') as keyof typeof TYPE_LABELS]}
                </Badge>
                {resource.accessType === 'premium' ? (
                  <Badge variant="premium"><Lock size={10} /> Premium</Badge>
                ) : (
                  <Badge variant="success">Free</Badge>
                )}
              </div>

              <h1 className={styles.title}>{resource.title || resource.filename}</h1>
              <p className={styles.description}>{resource.description}</p>

              <div className={styles.stats}>
                <span><Eye size={14} /> {(resource.viewCount ?? 0).toLocaleString()} views</span>
                <span><ShoppingCart size={14} /> {(resource.purchaseCount ?? 0).toLocaleString()} purchases</span>
                <Rating value={resource.averageRating ?? 5} count={resource.reviewCount ?? 0} />
              </div>

              {/* Tutor */}
              {resource.tutor && (
                <Link to={ROUTES.TUTOR_PROFILE(resource.tutor.id)} className={styles.tutorLink}>
                  <Avatar src={resource.tutor.avatarUrl || (resource.tutor as any).profilePic || undefined} name={resource.tutor.name} size="md" />
                  <div>
                    <div className={styles.tutorName}>{resource.tutor.name}</div>
                    {(resource.tutor as any).isVerified && <Badge variant="success">✓ Verified Tutor</Badge>}
                  </div>
                </Link>
              )}
            </div>

            {/* Reviews */}
            <div className={styles.reviewsSection}>
              <div className={styles.reviewsHeader}>
                <h2>Reviews</h2>
                {isAuthenticated && hasPurchased && (
                  <Button size="sm" variant="secondary" onClick={() => setReviewModal(true)}>
                    Write a Review
                  </Button>
                )}
              </div>
              {reviews.length > 0 ? (
                <div className={styles.reviewList}>
                  {reviews.map(r => (
                    <div key={r.id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <Avatar name={r.student?.name} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{r.student?.name}</div>
                          <Rating value={r.rating} showValue={false} size="sm" />
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-gray-400)' }}>
                          {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--color-gray-600)', lineHeight: 1.6 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-gray-400)', fontSize: 14 }}>No reviews yet. Be the first!</p>
              )}
            </div>
          </div>

          {/* Right — Purchase/Access Card */}
          <div className={styles.sidebar}>
            <div className={styles.purchaseCard}>
              {canAccess ? (
                <>
                  <div className={styles.accessedBadge}>
                    <Unlock size={20} />
                    <span>You have access</span>
                  </div>
                  {resource.type !== 'youtube' && resource.fileUrl && (() => {
                    const rawFile = resource.fileUrl;
                    const viewUrl = rawFile.startsWith('http') ? rawFile : `http://localhost:5000${rawFile.startsWith('/') ? '' : '/'}${rawFile}`;
                    return (
                      <button
                        onClick={() => setPdfViewerUrl(viewUrl)}
                        style={{
                          textDecoration: 'none', display: 'flex', width: '100%',
                          alignItems: 'center', justifyContent: 'center', gap: 8,
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: '#fff', border: 'none', borderRadius: 10,
                          padding: '12px 20px', fontSize: '0.95rem', fontWeight: 700,
                          cursor: 'pointer', transition: 'opacity 0.2s',
                        }}
                      >
                        <Eye size={16} />
                        View Resource (Read Only)
                      </button>
                    );
                  })()}
                </>
              ) : (
                <>
                  <div className={styles.priceSection}>
                    {resource.price && (
                      <div className={styles.price}>₹{resource.price}</div>
                    )}
                    <p className={styles.priceNote}>One-time purchase • Lifetime access</p>
                  </div>
                  <Button
                    fullWidth size="lg"
                    isLoading={purchasing}
                    onClick={handlePurchase}
                    leftIcon={<Lock size={16} />}
                    variant="premium"
                  >
                    Unlock Resource
                  </Button>
                  {!isAuthenticated && (
                    <p className={styles.loginNote}>
                      <Link to={ROUTES.LOGIN} style={{ color: 'var(--color-primary-500)' }}>Log in</Link> to purchase
                    </p>
                  )}
                </>
              )}

              <Button variant="ghost" fullWidth leftIcon={<BookmarkPlus size={16} />}>
                Save for Later
              </Button>

              <div className={styles.cardInfo}>
                <div className={styles.cardInfoItem}><FileText size={14} /> {TYPE_LABELS[(resource.type || resource.fileType || 'pdf') as keyof typeof TYPE_LABELS]}</div>
                <div className={styles.cardInfoItem}><Star size={14} /> {(resource.averageRating ?? 5).toFixed(1)} Rating</div>
                <div className={styles.cardInfoItem}><Eye size={14} /> {(resource.viewCount ?? 0).toLocaleString()} views</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Write a Review">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Rating</p>
            <Rating value={reviewRating} size="lg" interactive onChange={setReviewRating} showValue={false} />
          </div>
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Share your experience with this resource..."
            rows={4}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
          />
          <Button
            fullWidth
            onClick={async () => {
              await reviewService.createReview({ rating: reviewRating, comment: reviewText, resourceId: resource.id });
              setReviewModal(false);
              toast.success('Review submitted!');
            }}
            disabled={reviewRating === 0 || !reviewText}
          >
            Submit Review
          </Button>
        </div>
      </Modal>

      {/* View-Only PDF/Resource Viewer Overlay */}
      <DocumentViewerModal
        isOpen={Boolean(pdfViewerUrl)}
        url={pdfViewerUrl}
        title="Resource Material — View Only"
        onClose={() => setPdfViewerUrl(null)}
      />
    </div>
  );
}
