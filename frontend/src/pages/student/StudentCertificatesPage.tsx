import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, ShieldCheck, Download, ExternalLink,
  ArrowRight, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentService } from '../../services/enrollmentService';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { CertificateModal } from '../../components/shared/CertificateModal';
import {
  getEarnedCertificates,
  saveCertificate,
  generateCertificateId,
  generateVerificationCode,
  type CourseCertificate,
} from '../../utils/certificateUtils';
import { getCourseProgress } from '../../utils/courseProgress';
import { ROUTES } from '../../constants';
import type { Enrollment } from '../../types';
import styles from './StudentCertificatesPage.module.css';

export function StudentCertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CourseCertificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<CourseCertificate | null>(null);

  useEffect(() => {
    const loadCertificatesAndEnrollments = async () => {
      setLoading(true);
      try {
        if (!user?.id) return;

        // 1. Load enrolled courses
        let enrolledCourses: Enrollment[] = [];
        try {
          const res = await enrollmentService.getMyEnrollments();
          enrolledCourses = Array.isArray(res) ? res : (res as any)?.data || [];
          setEnrollments(enrolledCourses);
        } catch {
          // fallback
        }

        // 2. Load already saved certificates
        let earned = getEarnedCertificates(user.id);

        // 3. Check enrolled courses if any course was completed (100% progress)
        for (const enr of enrolledCourses) {
          const c = enr.course;
          if (!c) continue;
          const courseId = c.courseId || (c as any).id;
          const totalLessons = c.lessons?.length || 0;

          // Check if student completed all lectures
          const progress = getCourseProgress(user.id, courseId);
          const completed = totalLessons > 0 ? progress.completedCount >= totalLessons : true;

          if (completed) {
            // Verify if a certificate exists already
            const existing = earned.find((item) => item.courseId === courseId);
            if (!existing) {
              const newCert: CourseCertificate = {
                certificateId: generateCertificateId(user.id, courseId),
                studentId: user.id,
                studentName: user.name || 'Student Scholar',
                courseId,
                courseTitle: c.title,
                tutorName: c.tutor?.name || 'StudyBuddy Instructor',
                tutorId: c.tutorId,
                categoryName: c.category?.name || 'Academic Course',
                completedAt: (progress as any).updatedAt || new Date().toISOString(),
                totalLessons: totalLessons > 0 ? totalLessons : 1,
                verificationCode: generateVerificationCode(user.id, courseId),
              };
              saveCertificate(newCert);
              earned = [newCert, ...earned];
            }
          }
        }

        setCertificates(earned);
      } finally {
        setLoading(false);
      }
    };

    loadCertificatesAndEnrollments();
  }, [user?.id, user?.name]);

  // Compute in-progress courses (courses that have <100% progress)
  const inProgressList = enrollments
    .map((enr) => {
      const c = enr.course;
      if (!c) return null;
      const cId = c.courseId || (c as any).id;
      const total = c.lessons?.length || 0;
      const progress = user?.id ? getCourseProgress(user.id, cId) : { completedCount: 0 };
      const percent = total > 0 ? Math.min(100, Math.round((progress.completedCount / total) * 100)) : 0;
      const isComplete = total > 0 ? progress.completedCount >= total : false;
      return {
        enrollment: enr,
        course: c,
        totalLessons: total,
        completedCount: progress.completedCount,
        percent,
        isComplete,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null && !item.isComplete);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badgeArea}>
            <Badge variant="primary">
              <Award size={12} />
              Academic Credentials
            </Badge>
          </div>
          <h1 className={styles.title}>My Course Certificates</h1>
          <p className={styles.subtitle}>
            Verified diplomas and certificates issued upon 100% completion of course lectures. Download and add them to your portfolio.
          </p>
        </div>

        {certificates.length > 0 && (
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{certificates.length}</span>
              <span className={styles.statLabel}>Certificates Earned</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>Verification Rate</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loadingArea}>
          <p>Loading your certificates...</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className={styles.emptyContainer}>
          <EmptyState
            title="No Certificates Earned Yet"
            description="Certificates are unlocked when you complete all video lectures and lessons in an enrolled course. Keep learning to earn your first certificate!"
            action={{
              label: 'Explore Courses',
              onClick: () => { window.location.href = ROUTES.COURSES; },
            }}
          />

          {inProgressList.length > 0 && (
            <div className={styles.inProgressSection}>
              <h3 className={styles.sectionHeading}>
                Courses in Progress — Complete to Unlock Certificate
              </h3>
              <div className={styles.inProgressGrid}>
                {inProgressList.map((item) => (
                  <div key={item.course.courseId || (item.course as any).id} className={styles.progressCard}>
                    <div className={styles.progressCourseInfo}>
                      <span className={styles.courseName}>{item.course.title}</span>
                      <span className={styles.tutorName}>Taught by {item.course.tutor?.name || 'Educator'}</span>
                    </div>

                    <div className={styles.progressRow}>
                      <ProgressBar value={item.percent} />
                      <div className={styles.progressMeta}>
                        <span>{item.completedCount} of {item.totalLessons} lectures finished</span>
                        <span>{item.percent}%</span>
                      </div>
                    </div>

                    <Link to={`/courses/${item.course.courseId || (item.course as any).id}`}>
                      <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
                        Continue Learning
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Certificate Cards Grid */}
          <div className={styles.certGrid}>
            {certificates.map((cert) => {
              const formattedDate = new Date(cert.completedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={cert.certificateId} className={styles.certCard}>
                  {/* Certificate Preview Top Banner */}
                  <div className={styles.certBanner}>
                    <div className={styles.certBannerEmblem}>
                      <Award size={36} color="#fbbf24" />
                    </div>
                    <div className={styles.certBannerTag}>
                      <ShieldCheck size={12} color="#059669" />
                      <span>OFFICIAL COMPLETION</span>
                    </div>
                  </div>

                  <div className={styles.certCardBody}>
                    <div className={styles.certCardHeader}>
                      <span className={styles.certDiscipline}>
                        {cert.categoryName || 'Academic Course'}
                      </span>
                      <span className={styles.certDate}>{formattedDate}</span>
                    </div>

                    <h3 className={styles.certCardTitle} title={cert.courseTitle}>
                      {cert.courseTitle}
                    </h3>

                    <p className={styles.certCardTutor}>
                      Educator: <strong>{cert.tutorName}</strong>
                    </p>

                    <div className={styles.certIdRow}>
                      <span>Credential ID:</span>
                      <code>{cert.certificateId}</code>
                    </div>

                    <div className={styles.certCardActions}>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        leftIcon={<Download size={14} />}
                        onClick={() => setSelectedCert(cert)}
                        style={{ backgroundColor: '#2563EB', fontWeight: 600 }}
                      >
                        View & Download Certificate
                      </Button>
                      <Link
                        to={`/courses/${cert.courseId}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Button variant="ghost" size="sm" fullWidth rightIcon={<ExternalLink size={13} />}>
                          Course Curriculum
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Courses in Progress Section */}
          {inProgressList.length > 0 && (
            <div className={styles.inProgressSection}>
              <h2 className={styles.sectionHeading}>
                <Clock size={18} color="var(--color-primary-600)" />
                Courses in Progress ({inProgressList.length})
              </h2>
              <div className={styles.inProgressGrid}>
                {inProgressList.map((item) => (
                  <div key={item.course.courseId || (item.course as any).id} className={styles.progressCard}>
                    <div className={styles.progressCourseInfo}>
                      <span className={styles.courseName}>{item.course.title}</span>
                      <span className={styles.tutorName}>Taught by {item.course.tutor?.name || 'Educator'}</span>
                    </div>

                    <div className={styles.progressRow}>
                      <ProgressBar value={item.percent} />
                      <div className={styles.progressMeta}>
                        <span>{item.completedCount} of {item.totalLessons} lectures finished</span>
                        <span>{item.percent}%</span>
                      </div>
                    </div>

                    <Link to={`/courses/${item.course.courseId || (item.course as any).id}`}>
                      <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
                        Continue Course
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Certificate Display / Print Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          isOpen={Boolean(selectedCert)}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}
