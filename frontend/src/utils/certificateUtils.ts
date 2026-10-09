/**
 * Certificate management and verification utilities for StudyBuddy
 */

export interface CourseCertificate {
  certificateId: string;
  studentId: number;
  studentName: string;
  courseId: number;
  courseTitle: string;
  tutorName: string;
  tutorId?: number;
  categoryName?: string;
  completedAt: string;
  totalLessons: number;
  verificationCode: string;
}

export function generateCertificateId(studentId: number, courseId: number): string {
  const hash = Math.abs((studentId * 31 + courseId * 97 + 2026) % 90000) + 10000;
  return `SB-CERT-2026-${courseId}-${hash}`;
}

export function generateVerificationCode(studentId: number, courseId: number): string {
  const raw = `${studentId}-${courseId}-SB-VERIFIED`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

export function saveCertificate(certificate: CourseCertificate): void {
  try {
    const key = `sb_certificates_${certificate.studentId}`;
    const raw = localStorage.getItem(key);
    const list: CourseCertificate[] = raw ? JSON.parse(raw) : [];
    const existingIdx = list.findIndex(c => c.courseId === certificate.courseId);
    if (existingIdx >= 0) {
      list[existingIdx] = certificate;
    } else {
      list.unshift(certificate);
    }
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('sb-certificate-issued', { detail: certificate }));
  } catch (err) {
    console.error('Failed to save certificate:', err);
  }
}

export function getEarnedCertificates(studentId: number): CourseCertificate[] {
  try {
    const key = `sb_certificates_${studentId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCertificateForCourse(studentId: number, courseId: number): CourseCertificate | null {
  const certs = getEarnedCertificates(studentId);
  return certs.find(c => c.courseId === courseId) || null;
}
