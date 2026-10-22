/**
 * Progress data shape, validation and migration. Pure functions only, so the
 * same logic is used when loading from localStorage and when importing a file.
 */

export type ExerciseRecord = { passed: boolean; attempts: number; updatedAt: string };

export type Progress = {
  version: 2;
  /** Keyed by `${lessonId}:${exerciseId}`. */
  exercises: Record<string, ExerciseRecord>;
  /** Lessons whose hands-on practice the learner marked as done (self-reported). */
  practiced: string[];
  notes: Record<string, string>;
  lastLesson: string | null;
  /** Local date (YYYY-MM-DD) -> number of exercises passed for the first time. */
  activity: Record<string, number>;
};

export const EMPTY_PROGRESS: Progress = {
  version: 2,
  exercises: {},
  practiced: [],
  notes: {},
  lastLesson: null,
  activity: {},
};

const LESSON_ID = /^m\d{1,2}-\d{1,2}$/;
const EXERCISE_KEY = /^m\d{1,2}-\d{1,2}:[a-z0-9-]{1,40}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_NOTE_LENGTH = 20_000;
export const MAX_IMPORT_LENGTH = 2_000_000;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function pickNotes(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter((e): e is [string, string] => LESSON_ID.test(e[0]) && typeof e[1] === 'string' && e[1].trim() !== '')
      .map(([k, v]) => [k, v.slice(0, MAX_NOTE_LENGTH)]),
  );
}

function pickLessonIds(value: unknown) {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && LESSON_ID.test(id)))] : [];
}

/**
 * Accepts v2 data, or v1 data from the first Springpath release
 * (`{ done, notes, last, days }`), and returns a clean v2 object.
 * Returns null when the value is not recognisable progress data.
 */
export function sanitizeProgress(value: unknown): Progress | null {
  if (!isRecord(value)) return null;

  if (value.version === 2) {
    const exercises: Record<string, ExerciseRecord> = {};
    if (isRecord(value.exercises)) {
      for (const [key, rec] of Object.entries(value.exercises)) {
        if (!EXERCISE_KEY.test(key) || !isRecord(rec)) continue;
        const attempts = typeof rec.attempts === 'number' ? rec.attempts : 0;
        exercises[key] = {
          passed: rec.passed === true,
          attempts: Number.isFinite(attempts) && attempts >= 0 ? Math.min(Math.floor(attempts), 1e6) : 0,
          updatedAt: typeof rec.updatedAt === 'string' ? rec.updatedAt.slice(0, 40) : '',
        };
      }
    }
    const activity: Record<string, number> = {};
    if (isRecord(value.activity)) {
      for (const [day, n] of Object.entries(value.activity)) {
        if (DAY.test(day) && typeof n === 'number' && Number.isFinite(n) && n > 0) activity[day] = Math.min(Math.floor(n), 1e6);
      }
    }
    return {
      version: 2,
      exercises,
      practiced: pickLessonIds(value.practiced),
      notes: pickNotes(value.notes),
      lastLesson: typeof value.lastLesson === 'string' && LESSON_ID.test(value.lastLesson) ? value.lastLesson : null,
      activity,
    };
  }

  // v1: checklist items were self-reported, so they become "practiced".
  if (Array.isArray(value.done) && isRecord(value.notes)) {
    return { ...EMPTY_PROGRESS, practiced: pickLessonIds(value.done), notes: pickNotes(value.notes) };
  }

  return null;
}

/** Merge imported progress into current progress without losing passes on either side. */
export function mergeProgress(current: Progress, incoming: Progress): Progress {
  const exercises = { ...current.exercises };
  for (const [key, rec] of Object.entries(incoming.exercises)) {
    const mine = exercises[key];
    exercises[key] = mine
      ? { passed: mine.passed || rec.passed, attempts: Math.max(mine.attempts, rec.attempts), updatedAt: mine.updatedAt > rec.updatedAt ? mine.updatedAt : rec.updatedAt }
      : rec;
  }
  const activity = { ...current.activity };
  for (const [day, n] of Object.entries(incoming.activity)) activity[day] = Math.max(activity[day] ?? 0, n);
  return {
    version: 2,
    exercises,
    practiced: [...new Set([...current.practiced, ...incoming.practiced])],
    notes: { ...current.notes, ...incoming.notes },
    lastLesson: current.lastLesson ?? incoming.lastLesson,
    activity,
  };
}

export function exerciseKey(lessonId: string, exerciseId: string) {
  return `${lessonId}:${exerciseId}`;
}

export function localDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Consecutive active days ending today (or yesterday, so a streak survives until the day ends). */
export function currentStreak(activity: Record<string, number>, today = new Date()) {
  const cursor = new Date(today);
  if (!activity[localDay(cursor)]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activity[localDay(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
