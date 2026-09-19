/**
 * Course progress & learning engagement tracking utility (student side)
 * Saves lesson completion and verified learning engagement per student and course.
 */

export interface LessonEngagement {
  videoWatched?: boolean; // Student has opened / played the lecture video
  materialViewed?: boolean; // Student has opened / reviewed the lecture's study material
  engagedAt?: string;
}

export interface CourseProgressData {
  completedLessons: number[]; // indices of completed lessons
  lessonEngagement?: Record<number, LessonEngagement>; // lessonIdx -> engagement record
  updatedAt: string;
}

export function getCourseProgress(
  studentId: number | string | undefined,
  courseId: number | string | undefined
): {
  completedLessons: number[];
  completedCount: number;
  isLessonCompleted: (idx: number) => boolean;
  getProgressPercent: (total: number) => number;
} {
  if (!studentId || !courseId) {
    return {
      completedLessons: [],
      completedCount: 0,
      isLessonCompleted: () => false,
      getProgressPercent: () => 0,
    };
  }

  try {
    const key = `sb_progress_${studentId}_${courseId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        completedLessons: [],
        completedCount: 0,
        isLessonCompleted: () => false,
        getProgressPercent: () => 0,
      };
    }

    const parsed: CourseProgressData = JSON.parse(raw);
    const completedLessons = Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [];

    return {
      completedLessons,
      completedCount: completedLessons.length,
      isLessonCompleted: (idx: number) => completedLessons.includes(idx),
      getProgressPercent: (total: number) =>
        total > 0 ? Math.min(100, Math.round((completedLessons.length / total) * 100)) : 0,
    };
  } catch {
    return {
      completedLessons: [],
      completedCount: 0,
      isLessonCompleted: () => false,
      getProgressPercent: () => 0,
    };
  }
}

export function getAllEngagements(
  studentId: number | string | undefined,
  courseId: number | string | undefined
): Record<number, LessonEngagement> {
  if (!studentId || !courseId) return {};
  try {
    const key = `sb_progress_${studentId}_${courseId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed: CourseProgressData = JSON.parse(raw);
    return parsed.lessonEngagement || {};
  } catch {
    return {};
  }
}

export function recordLessonEngagement(
  studentId: number | string | undefined,
  courseId: number | string | undefined,
  lessonIdx: number,
  type: 'video' | 'material'
): { engagement: LessonEngagement; canComplete: boolean } {
  if (!studentId || !courseId) return { engagement: {}, canComplete: false };
  try {
    const key = `sb_progress_${studentId}_${courseId}`;
    const raw = localStorage.getItem(key);
    const parsed: CourseProgressData = raw ? JSON.parse(raw) : { completedLessons: [] };
    const currentEngagement = parsed.lessonEngagement || {};
    const existing = currentEngagement[lessonIdx] || {};

    const updated: LessonEngagement = {
      ...existing,
      videoWatched: type === 'video' ? true : existing.videoWatched,
      materialViewed: type === 'material' ? true : existing.materialViewed,
      engagedAt: new Date().toISOString(),
    };

    currentEngagement[lessonIdx] = updated;
    parsed.lessonEngagement = currentEngagement;
    parsed.updatedAt = new Date().toISOString();

    localStorage.setItem(key, JSON.stringify(parsed));

    window.dispatchEvent(
      new CustomEvent('course-progress-updated', {
        detail: { studentId, courseId, lessonIdx, engagement: updated },
      })
    );

    return { engagement: updated, canComplete: true };
  } catch {
    return { engagement: {}, canComplete: false };
  }
}

export function isLessonEngaged(
  studentId: number | string | undefined,
  courseId: number | string | undefined,
  lessonIdx: number
): boolean {
  if (!studentId || !courseId) return false;
  try {
    const key = `sb_progress_${studentId}_${courseId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed: CourseProgressData = JSON.parse(raw);
    const eng = parsed.lessonEngagement?.[lessonIdx];
    return Boolean(eng?.videoWatched || eng?.materialViewed);
  } catch {
    return false;
  }
}

/**
 * Toggle lesson completion.
 * Verification rule: A lesson CANNOT be completed unless the student has engaged
 * with the lecture video or reviewed the lecture materials first!
 */
export function toggleLessonProgress(
  studentId: number | string | undefined,
  courseId: number | string | undefined,
  lessonIdx: number,
  bypassEngagement: boolean = false
): { isCompleted: boolean; completedCount: number; requiresEngagement?: boolean } {
  if (!studentId || !courseId) return { isCompleted: false, completedCount: 0 };

  try {
    const key = `sb_progress_${studentId}_${courseId}`;
    const raw = localStorage.getItem(key);
    const parsed: CourseProgressData = raw ? JSON.parse(raw) : { completedLessons: [] };
    const current: number[] = Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [];
    const engagements = parsed.lessonEngagement || {};
    const eng = engagements[lessonIdx];
    const hasEngaged = Boolean(eng?.videoWatched || eng?.materialViewed);

    let updated: number[];
    let isCompleted: boolean;

    if (current.includes(lessonIdx)) {
      // Unmarking is allowed anytime
      updated = current.filter((idx) => idx !== lessonIdx);
      isCompleted = false;
    } else {
      // Must have actually watched the video or studied materials first!
      if (!hasEngaged && !bypassEngagement) {
        return {
          isCompleted: false,
          completedCount: current.length,
          requiresEngagement: true,
        };
      }
      updated = [...current, lessonIdx];
      isCompleted = true;
    }

    const payload: CourseProgressData = {
      completedLessons: updated,
      lessonEngagement: engagements,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(payload));

    // Notify other components & tabs
    window.dispatchEvent(
      new CustomEvent('course-progress-updated', {
        detail: { studentId, courseId, lessonIdx, isCompleted, completedCount: updated.length },
      })
    );

    return { isCompleted, completedCount: updated.length };
  } catch (err) {
    console.error('Failed to toggle course progress:', err);
    return { isCompleted: false, completedCount: 0 };
  }
}

export function resetCourseProgress(
  studentId: number | string | undefined,
  courseId: number | string | undefined
): { completedLessons: number[]; completedCount: number } {
  if (!studentId || !courseId) return { completedLessons: [], completedCount: 0 };
  try {
    const key = `sb_progress_${studentId}_${courseId}`;
    const payload: CourseProgressData = {
      completedLessons: [],
      lessonEngagement: {},
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
    window.dispatchEvent(
      new CustomEvent('course-progress-updated', {
        detail: { studentId, courseId, isCompleted: false, completedCount: 0, reset: true },
      })
    );
    return { completedLessons: [], completedCount: 0 };
  } catch {
    return { completedLessons: [], completedCount: 0 };
  }
}

export function isCourseCompleted(
  studentId: number | string | undefined,
  courseId: number | string | undefined,
  totalLessons: number
): boolean {
  if (!studentId || !courseId || totalLessons <= 0) return false;
  const progress = getCourseProgress(studentId, courseId);
  return progress.completedCount >= totalLessons;
}

