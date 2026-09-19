/**
 * Bundle Progressive Learning & Verified Rating Utilities
 * Enforces genuine study engagement before unlocking bundle ratings & reviews.
 */

export interface BundleProgress {
  completedCount: number;
  totalCount: number;
  percent: number;
  isCompleted: boolean;
  studiedResourceIds: number[];
}

export interface BundleReviewItem {
  id: string;
  bundleId: number;
  studentId: number;
  studentName: string;
  studentAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerifiedGraduate: boolean;
}

function getProgressKey(studentId: number | string | undefined, bundleId: number | string): string {
  const sId = studentId ? String(studentId) : 'guest';
  return `sb_bundle_progress_${sId}_${bundleId}`;
}

function getReviewsKey(bundleId: number | string): string {
  return `sb_bundle_reviews_${bundleId}`;
}

export function getBundleProgress(
  studentId: number | string | undefined,
  bundleId: number | string,
  totalMaterials: number = 0
): BundleProgress {
  if (!bundleId) {
    return { completedCount: 0, totalCount: totalMaterials, percent: 0, isCompleted: false, studiedResourceIds: [] };
  }

  try {
    const raw = localStorage.getItem(getProgressKey(studentId, bundleId));
    const studiedList: number[] = raw ? JSON.parse(raw) : [];
    const uniqueStudied = Array.from(new Set(studiedList.map(Number))).filter(Boolean);
    const completedCount = totalMaterials > 0 ? Math.min(uniqueStudied.length, totalMaterials) : uniqueStudied.length;
    const percent = totalMaterials > 0 ? Math.min(100, Math.round((completedCount / totalMaterials) * 100)) : 0;
    const isCompleted = totalMaterials > 0 && completedCount >= totalMaterials;

    return {
      completedCount,
      totalCount: totalMaterials,
      percent,
      isCompleted,
      studiedResourceIds: uniqueStudied,
    };
  } catch {
    return { completedCount: 0, totalCount: totalMaterials, percent: 0, isCompleted: false, studiedResourceIds: [] };
  }
}

export function isMaterialStudied(
  studentId: number | string | undefined,
  bundleId: number | string,
  resourceId: number | string
): boolean {
  if (!bundleId || !resourceId) return false;
  const progress = getBundleProgress(studentId, bundleId, 0);
  return progress.studiedResourceIds.includes(Number(resourceId));
}

export function recordBundleEngagement(
  studentId: number | string | undefined,
  bundleId: number | string,
  resourceId: number | string
): BundleProgress {
  if (!bundleId || !resourceId) {
    return getBundleProgress(studentId, bundleId);
  }

  try {
    const key = getProgressKey(studentId, bundleId);
    const raw = localStorage.getItem(key);
    const current: number[] = raw ? JSON.parse(raw) : [];
    const rId = Number(resourceId);

    if (!current.includes(rId)) {
      current.push(rId);
      localStorage.setItem(key, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('bundle-progress-updated', {
        detail: { bundleId: Number(bundleId), studentId, resourceId: rId }
      }));
    }
  } catch (e) {
    console.error('Failed to record bundle engagement', e);
  }

  return getBundleProgress(studentId, bundleId);
}

export function toggleMaterialStudied(
  studentId: number | string | undefined,
  bundleId: number | string,
  resourceId: number | string,
  studied?: boolean
): BundleProgress {
  if (!bundleId || !resourceId) return getBundleProgress(studentId, bundleId);

  try {
    const key = getProgressKey(studentId, bundleId);
    const raw = localStorage.getItem(key);
    let current: number[] = raw ? JSON.parse(raw) : [];
    const rId = Number(resourceId);

    const shouldAdd = studied !== undefined ? studied : !current.includes(rId);
    if (shouldAdd) {
      if (!current.includes(rId)) current.push(rId);
    } else {
      current = current.filter(id => id !== rId);
    }

    localStorage.setItem(key, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('bundle-progress-updated', {
      detail: { bundleId: Number(bundleId), studentId, resourceId: rId, studied: shouldAdd }
    }));
  } catch (e) {
    console.error('Failed to toggle material studied state', e);
  }

  return getBundleProgress(studentId, bundleId);
}

export function isBundleCompleted(
  studentId: number | string | undefined,
  bundleId: number | string,
  totalMaterials: number
): boolean {
  if (!totalMaterials || totalMaterials <= 0) return false;
  return getBundleProgress(studentId, bundleId, totalMaterials).isCompleted;
}

// ─────────────────────────────────────────────────────────────
// Bundle Reviews Storage & Verification
// ─────────────────────────────────────────────────────────────

export function getBundleReviews(bundleId: number | string): BundleReviewItem[] {
  if (!bundleId) return [];
  try {
    const raw = localStorage.getItem(getReviewsKey(bundleId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* fallback */
  }
  return [];
}

export function getUserBundleReview(
  bundleId: number | string,
  studentId: number | string | undefined
): BundleReviewItem | undefined {
  if (!bundleId || !studentId) return undefined;
  const reviews = getBundleReviews(bundleId);
  return reviews.find(r => Number(r.studentId) === Number(studentId));
}

export function saveBundleReview(
  bundleId: number | string,
  review: {
    studentId: number;
    studentName: string;
    studentAvatar?: string;
    rating: number;
    comment: string;
  }
): BundleReviewItem {
  const key = getReviewsKey(bundleId);
  const reviews = getBundleReviews(bundleId);
  const existingIdx = reviews.findIndex(r => Number(r.studentId) === Number(review.studentId));

  let savedItem: BundleReviewItem;

  if (existingIdx >= 0) {
    savedItem = {
      ...reviews[existingIdx],
      rating: review.rating,
      comment: review.comment,
      studentName: review.studentName || reviews[existingIdx].studentName,
      studentAvatar: review.studentAvatar || reviews[existingIdx].studentAvatar,
      isVerifiedGraduate: true,
      createdAt: new Date().toISOString(),
    };
    reviews[existingIdx] = savedItem;
  } else {
    savedItem = {
      id: `br_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      bundleId: Number(bundleId),
      studentId: Number(review.studentId),
      studentName: review.studentName,
      studentAvatar: review.studentAvatar,
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date().toISOString(),
      isVerifiedGraduate: true,
    };
    reviews.unshift(savedItem);
  }

  localStorage.setItem(key, JSON.stringify(reviews));
  window.dispatchEvent(new CustomEvent('bundle-review-updated', {
    detail: { bundleId: Number(bundleId), review: savedItem }
  }));

  return savedItem;
}
