import { useRef, useState } from 'react';
import { X, Download, Award, ShieldCheck, CheckCircle2, Image as ImageIcon, Printer } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import type { CourseCertificate } from '../../utils/certificateUtils';
import {
  downloadCertificateAsPdf,
  downloadCertificateAsImage,
  printCertificateDirectly,
} from '../../utils/certificatePrintUtils';
import toast from 'react-hot-toast';
import styles from './CertificateModal.module.css';

interface CertificateModalProps {
  certificate: CourseCertificate;
  isOpen: boolean;
  onClose: () => void;
}

export function CertificateModal({ certificate, isOpen, onClose }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingImg, setDownloadingImg] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const toastId = toast.loading('Generating official PDF certificate...');
      await downloadCertificateAsPdf(certificate);
      toast.dismiss(toastId);
      toast.success('Certificate PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Direct PDF export encountered an issue. Falling back to high-res PNG...');
      downloadCertificateAsImage(certificate);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadImage = () => {
    try {
      setDownloadingImg(true);
      toast.success('Downloading high-resolution certificate image (PNG)...');
      downloadCertificateAsImage(certificate);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download image.');
    } finally {
      setTimeout(() => setDownloadingImg(false), 500);
    }
  };

  const handlePrint = () => {
    try {
      toast('Opening print preview...', { icon: '🖨️' });
      printCertificateDirectly(certificate);
    } catch (err) {
      console.error('Print error:', err);
      window.print();
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(certificate.certificateId);
    toast.success('Certificate ID copied to clipboard!');
  };

  const formattedDate = new Date(certificate.completedAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Modal Controls Bar */}
        <div className={styles.actionBar}>
          <div className={styles.actionLeft}>
            <Award size={20} className={styles.awardIcon} />
            <div>
              <h3 className={styles.modalTitle}>Official Certificate of Completion</h3>
              <p className={styles.modalSubtitle}>Earned on {formattedDate} • ID: {certificate.certificateId}</p>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download size={15} />}
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              style={{ backgroundColor: '#2563EB', fontWeight: 600 }}
              title="Download official PDF file directly to your device"
            >
              {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ImageIcon size={15} />}
              onClick={handleDownloadImage}
              disabled={downloadingImg}
              style={{ fontWeight: 600 }}
              title="Download crystal-clear PNG image directly"
            >
              {downloadingImg ? 'Generating...' : 'Download PNG'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Printer size={15} />}
              onClick={handlePrint}
              style={{ fontWeight: 500 }}
              title="Print certificate"
            >
              Print
            </Button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* The Printable Certificate Frame */}
        <div className={styles.certScrollWrapper}>
          <div ref={certRef} className={styles.certificatePaper} id="sb-printable-certificate">
            {/* Guilloche / Ornate Border Layers */}
            <div className={styles.certOuterBorder}>
              <div className={styles.certInnerBorder}>
                {/* Corner Decorative Ornaments */}
                <div className={`${styles.cornerOrnament} ${styles.topLeft}`}>❖</div>
                <div className={`${styles.cornerOrnament} ${styles.topRight}`}>❖</div>
                <div className={`${styles.cornerOrnament} ${styles.bottomLeft}`}>❖</div>
                <div className={`${styles.cornerOrnament} ${styles.bottomRight}`}>❖</div>

                {/* Certificate Content */}
                <div className={styles.certBody}>
                  {/* Header: Logo and Organization */}
                  <div className={styles.certHeader}>
                    <div className={styles.certLogoRow}>
                      <div className={styles.certLogoMark}>
                        <span className={styles.logoCap}>🎓</span>
                      </div>
                      <div className={styles.certBrand}>
                        <span className={styles.certBrandName}>StudyBuddy</span>
                        <span className={styles.certBrandTag}>ACCREDITED PEER-TO-PEER LEARNING PLATFORM</span>
                      </div>
                    </div>

                    <div className={styles.certBadge}>
                      <ShieldCheck size={14} color="#059669" />
                      <span>OFFICIALLY VERIFIED CREDENTIAL</span>
                    </div>
                  </div>

                  {/* Main Titles */}
                  <div className={styles.certTitleSection}>
                    <h1 className={styles.certMainTitle}>Certificate of Completion</h1>
                    <div className={styles.titleDivider}>
                      <span className={styles.dividerLine} />
                      <span className={styles.dividerDiamond}>✦</span>
                      <span className={styles.dividerLine} />
                    </div>
                    <p className={styles.certConferText}>
                      THIS IS PROUDLY PRESENTED TO
                    </p>
                  </div>

                  {/* Student Name */}
                  <div className={styles.recipientSection}>
                    <h2 className={styles.studentName}>
                      {certificate.studentName || 'Distinguished Scholar'}
                    </h2>
                    <div className={styles.nameUnderline} />
                  </div>

                  {/* Course Achievement Description */}
                  <div className={styles.descriptionSection}>
                    <p className={styles.certStatement}>
                      for successfully demonstrating mastery and completing all lectures, curriculum modules, and academic requirements for
                    </p>
                    <h3 className={styles.courseTitle}>
                      {certificate.courseTitle}
                    </h3>
                    {certificate.categoryName && (
                      <span className={styles.categoryPill}>
                        Academic Discipline: {certificate.categoryName}
                      </span>
                    )}
                  </div>

                  {/* Instructor Mention */}
                  <div className={styles.instructorMention}>
                    <p>
                      Course instructed and verified by <strong>{certificate.tutorName || 'StudyBuddy Educator'}</strong>
                      {certificate.totalLessons > 0 && ` • ${certificate.totalLessons} Comprehensive Lectures Completed`}
                    </p>
                  </div>

                  {/* Footer: Signatures and Gold Embossed Seal */}
                  <div className={styles.certFooter}>
                    {/* Instructor Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.handwrittenSign}>
                        {certificate.tutorName || 'Verified Tutor'}
                      </div>
                      <div className={styles.signLine} />
                      <span className={styles.signTitle}>Course Instructor</span>
                      <span className={styles.signSub}>{certificate.tutorName || 'Subject Matter Specialist'}</span>
                    </div>

                    {/* Gold Official Seal Badge */}
                    <div className={styles.goldSealWrapper}>
                      <div className={styles.goldSeal}>
                        <div className={styles.sealInner}>
                          <Award size={28} className={styles.sealIcon} />
                          <span className={styles.sealTextTop}>STUDYBUDDY</span>
                          <span className={styles.sealTextMid}>VERIFIED</span>
                          <span className={styles.sealTextBottom}>EXCELLENCE</span>
                        </div>
                      </div>
                      <div className={styles.sealRibbonLeft} />
                      <div className={styles.sealRibbonRight} />
                    </div>

                    {/* Academic Council Signature */}
                    <div className={styles.signatureBlock}>
                      <div className={styles.handwrittenSign}>
                        Dr. A. Verma
                      </div>
                      <div className={styles.signLine} />
                      <span className={styles.signTitle}>Academic Director</span>
                      <span className={styles.signSub}>StudyBuddy Certification Board</span>
                    </div>
                  </div>

                  {/* Meta Bar: Date & Verification ID */}
                  <div className={styles.certMetaBar}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Issue Date:</span>
                      <span className={styles.metaVal}>{formattedDate}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Certificate ID:</span>
                      <span className={styles.metaVal}>{certificate.certificateId}</span>
                      <button type="button" onClick={handleCopyId} className={styles.copyIdBtn} title="Copy ID">
                        copy
                      </button>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Verification Code:</span>
                      <span className={styles.metaVal}>{certificate.verificationCode}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Helper */}
        <div className={styles.modalFooter}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} color="#059669" />
            This credential is tamper-proof, verified by StudyBuddy, and ready for your academic portfolio and resume.
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
