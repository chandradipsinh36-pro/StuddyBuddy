import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Star, Users, BookOpen, Play, ArrowLeft } from 'lucide-react';
import { tutorService } from '../../services/tutorService';
import { resourceService } from '../../services/resourceService';
import { reviewService } from '../../services/reviewService';
import { ResourceCard } from '../../components/shared/ResourceCard';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Badge } from '../../components/ui/Badge/Badge';
import { Rating } from '../../components/ui/Rating/Rating';
import { Button } from '../../components/ui/Button/Button';
import { Tabs } from '../../components/ui/Tabs/Tabs';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState/ErrorState';
import type { Tutor, Resource } from '../../types';

import styles from './TutorProfilePage.module.css';

export function TutorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [t, r, rv] = await Promise.all([
          tutorService.getTutor(+id),
          resourceService.getTutorResources(+id),
          reviewService.getTutorReviews(+id),
        ]);
        setTutor(t); setResources(r); setReviews(rv);
      } catch {
        setError('Could not load tutor profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Skeleton height="300px" />
        <div style={{ marginTop: 24 }}><Skeleton count={3} height="20px" /></div>
      </div>
    </div>
  );

  if (error || !tutor) return <ErrorState message={error || 'Tutor not found'} onRetry={() => navigate(-1)} />;

  const subjects = tutor.subjects || [];
  const skills = (tutor.skills || []).map((s: any) => typeof s === 'string' ? s : s.name || s.skillName || '');
  const trialVideoUrl = typeof tutor.trialVideo === 'string' ? tutor.trialVideo : tutor.trialVideo?.videoUrl;
  const avgRating = tutor.averageRating ?? 5;
  const reviewCount = tutor.reviewCount ?? tutor._count?.tutorReviewsReceived ?? 0;
  const studentCount = tutor.studentCount ?? tutor._count?.enrollments ?? 0;
  const exp = tutor.experience ?? (tutor as any).experienceYears ?? 5;

  const tabs = [
    {
      id: 'about', label: 'About',
      content: (
        <div className={styles.aboutSection}>
          <div className={styles.aboutBlock}>
            <h3>About {tutor.name}</h3>
            <p>{tutor.bio || 'Experienced educator dedicated to student success.'}</p>
          </div>
          <div className={styles.aboutBlock}>
            <h3>Subjects</h3>
            <div className={styles.tags}>{subjects.map(s => <Badge key={s} variant="primary">{s}</Badge>)}</div>
          </div>
          <div className={styles.aboutBlock}>
            <h3>Skills</h3>
            <div className={styles.tags}>{skills.map((skillName, idx) => <span key={idx} className={styles.skill}>{skillName}</span>)}</div>
          </div>
          <div className={styles.aboutBlock}>
            <h3>Experience</h3>
            <p>{exp} years of teaching experience</p>
          </div>
        </div>
      ),
    },
    {
      id: 'resources', label: `Resources (${resources.length})`,
      content: (
        <div className={styles.resourceGrid}>
          {resources.map(r => <ResourceCard key={r.id || r.resourceId} resource={r} />)}
        </div>
      ),
    },
    {
      id: 'reviews', label: `Reviews (${reviews.length})`,
      content: (
        <div className={styles.reviewList}>
          {reviews.map(r => (
            <div key={r.id || r.reviewId} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <Avatar name={r.student?.name} src={r.student?.avatarUrl || r.student?.profilePic || undefined} size="sm" />
                <div>
                  <div className={styles.reviewName}>{r.student?.name || 'Student'}</div>
                  <Rating value={r.rating} showValue={false} size="sm" />
                </div>
                <span className={styles.reviewDate}>{new Date(r.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <p className={styles.reviewComment}>{r.comment}</p>
              {r.tags && r.tags.length > 0 && (
                <div className={styles.tags}>{r.tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}</div>
              )}
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.profileLeft}>
            <Avatar src={tutor.avatarUrl || tutor.profilePic || undefined} name={tutor.name} size="xl" />
            <div className={styles.profileInfo}>
              <div className={styles.profileNameRow}>
                <h1 className={styles.profileName}>{tutor.name}</h1>
                {tutor.isVerified && (
                  <Badge variant="success">
                    <ShieldCheck size={12} /> Verified Tutor
                  </Badge>
                )}
              </div>
              <div className={styles.profileSubjects}>
                {subjects.map(s => <Badge key={s} variant="primary">{s}</Badge>)}
              </div>
              <div className={styles.profileStats}>
                <div className={styles.profileStat}>
                  <Star size={16} className={styles.statIcon} />
                  <span>{avgRating.toFixed(1)}</span>
                  <span className={styles.statLabel}>({reviewCount} reviews)</span>
                </div>
                <div className={styles.profileStat}>
                  <Users size={16} className={styles.statIcon} />
                  <span>{studentCount.toLocaleString()} students</span>
                </div>
                <div className={styles.profileStat}>
                  <BookOpen size={16} className={styles.statIcon} />
                  <span>{exp} years experience</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.profileActions}>
            {trialVideoUrl && (
              <Button
                variant="primary"
                leftIcon={<Play size={16} />}
                onClick={() => setVideoOpen(true)}
              >
                Watch Trial Video
              </Button>
            )}
            <Button variant="secondary">Send Message</Button>
          </div>
        </div>

        {/* Trial Video Modal */}
        {videoOpen && trialVideoUrl && (
          <div className={styles.videoOverlay} onClick={() => setVideoOpen(false)}>
            <div className={styles.videoModal} onClick={e => e.stopPropagation()}>
              <button className={styles.videoClose} onClick={() => setVideoOpen(false)}>✕</button>
              <iframe
                src={trialVideoUrl}
                title="Trial Video"
                className={styles.videoFrame}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <Tabs tabs={tabs} defaultTab="about" />
      </div>
    </div>
  );
}
