import { EMPTY_PROGRESS, exerciseKey, localDay, mergeProgress, sanitizeProgress, type Progress } from './schema.ts';

/**
 * Browser-only external store backed by localStorage, consumed through
 * React's useSyncExternalStore (see hooks/use-progress.ts).
 */

const KEY = 'springpath-v2';
const LEGACY_KEY = 'springpath-v1';

let cache: Progress | null = null;
let persistError = false;
const listeners = new Set<() => void>();

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    return (raw && sanitizeProgress(JSON.parse(raw))) || EMPTY_PROGRESS;
  } catch {
    persistError = true;
    return EMPTY_PROGRESS;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function getSnapshot(): Progress {
  if (!cache) cache = load();
  return cache;
}

export function getServerSnapshot(): Progress {
  return EMPTY_PROGRESS;
}

export function hasPersistError() {
  return persistError;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function update(recipe: (current: Progress) => Progress) {
  const next = recipe(getSnapshot());
  if (next === cache) return;
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    persistError = false;
  } catch {
    persistError = true;
  }
  emit();
}

export const progressActions = {
  recordAttempt(lessonId: string, exerciseId: string, passed: boolean) {
    update((p) => {
      const key = exerciseKey(lessonId, exerciseId);
      const prev = p.exercises[key];
      const firstPass = passed && !prev?.passed;
      const day = localDay();
      return {
        ...p,
        exercises: {
          ...p.exercises,
          // A pass is never revoked by a later wrong attempt.
          [key]: { passed: passed || Boolean(prev?.passed), attempts: (prev?.attempts ?? 0) + 1, updatedAt: new Date().toISOString() },
        },
        activity: firstPass ? { ...p.activity, [day]: (p.activity[day] ?? 0) + 1 } : p.activity,
      };
    });
  },
  togglePracticed(lessonId: string) {
    update((p) => ({
      ...p,
      practiced: p.practiced.includes(lessonId) ? p.practiced.filter((id) => id !== lessonId) : [...p.practiced, lessonId],
    }));
  },
  setNote(lessonId: string, text: string) {
    update((p) => {
      const notes = { ...p.notes };
      if (text.trim()) notes[lessonId] = text;
      else delete notes[lessonId];
      return { ...p, notes };
    });
  },
  visit(lessonId: string) {
    update((p) => (p.lastLesson === lessonId ? p : { ...p, lastLesson: lessonId }));
  },
  resetLesson(lessonId: string) {
    update((p) => ({
      ...p,
      exercises: Object.fromEntries(Object.entries(p.exercises).filter(([key]) => !key.startsWith(`${lessonId}:`))),
    }));
  },
  resetAll() {
    update(() => EMPTY_PROGRESS);
  },
  /** Returns false when the file is not valid Springpath progress. */
  importJson(text: string): boolean {
    let incoming: Progress | null = null;
    try {
      incoming = sanitizeProgress(JSON.parse(text));
    } catch {
      return false;
    }
    if (!incoming) return false;
    const data = incoming;
    update((p) => mergeProgress(p, data));
    return true;
  },
  exportJson() {
    return JSON.stringify(getSnapshot(), null, 2);
  },
};
