/**
 * Course progress tracking utility (student side)
 * Saves lesson completion status locally per student and course.
 */

export interface CourseProgressData {
  completedLessons: number[]; // indices of completed lessons
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

export function toggleLessonProgress(
  studentId: number | string | undefined,
  courseId: number | string | undefined,
  lessonIdx: number
): { isCompleted: boolean; completedCount: number } {
  if (!studentId || !courseId) return { isCompleted: false, completedCount: 0 };

  try {
    const key = `sb_progress_${studentId}_${courseId}`;
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : { completedLessons: [] };
    const current: number[] = Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [];

    let updated: number[];
    let isCompleted: boolean;

    if (current.includes(lessonIdx)) {
      updated = current.filter((idx) => idx !== lessonIdx);
      isCompleted = false;
    } else {
      updated = [...current, lessonIdx];
      isCompleted = true;
    }

    const payload: CourseProgressData = {
      completedLessons: updated,
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

export function markLessonAsCompleted(
  studentId: number | string | undefined,
  courseId: number | string | undefined,
  lessonIdx: number
): { completedCount: number } {
  if (!studentId || !courseId) return { completedCount: 0 };

  try {
    const key = `sb_progress_${studentId}_${courseId}`;
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : { completedLessons: [] };
    const current: number[] = Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [];

    if (!current.includes(lessonIdx)) {
      const updated = [...current, lessonIdx];
      const payload: CourseProgressData = {
        completedLessons: updated,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      window.dispatchEvent(
        new CustomEvent('course-progress-updated', {
          detail: { studentId, courseId, lessonIdx, isCompleted: true, completedCount: updated.length },
        })
      );
      return { completedCount: updated.length };
    }
    return { completedCount: current.length };
  } catch {
    return { completedCount: 0 };
  }
}
