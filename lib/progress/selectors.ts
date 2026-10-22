import { exerciseKey, type Progress } from './schema.ts';

/** Minimal lesson shape needed to compute status; avoids shipping lesson bodies to the client. */
export type LessonRef = { id: string; exerciseIds: string[] };
export type ModuleRef = { id: string; lessons: LessonRef[] };

export function lessonStatus(progress: Progress, lesson: LessonRef) {
  const passed = lesson.exerciseIds.filter((id) => progress.exercises[exerciseKey(lesson.id, id)]?.passed).length;
  const total = lesson.exerciseIds.length;
  const started = passed > 0 || lesson.exerciseIds.some((id) => progress.exercises[exerciseKey(lesson.id, id)]);
  return {
    passed,
    total,
    complete: total > 0 && passed === total,
    started,
    practiced: progress.practiced.includes(lesson.id),
  };
}

export function moduleStatus(progress: Progress, mod: ModuleRef) {
  const statuses = mod.lessons.map((l) => lessonStatus(progress, l));
  const complete = statuses.filter((s) => s.complete).length;
  return {
    complete,
    total: mod.lessons.length,
    percent: mod.lessons.length ? Math.round((complete / mod.lessons.length) * 100) : 0,
    started: statuses.some((s) => s.started || s.practiced),
    done: complete === mod.lessons.length,
  };
}

export function overallStatus(progress: Progress, modules: ModuleRef[]) {
  const all = modules.flatMap((m) => m.lessons);
  const lessonsComplete = all.filter((l) => lessonStatus(progress, l).complete).length;
  const exercisesTotal = all.reduce((n, l) => n + l.exerciseIds.length, 0);
  const exercisesPassed = all.reduce((n, l) => n + lessonStatus(progress, l).passed, 0);
  return {
    lessonsComplete,
    lessonsTotal: all.length,
    exercisesPassed,
    exercisesTotal,
    modulesComplete: modules.filter((m) => moduleStatus(progress, m).done).length,
    percent: all.length ? Math.round((lessonsComplete / all.length) * 100) : 0,
  };
}

/** First lesson that is not complete, starting from the last visited one. */
export function nextLessonId(progress: Progress, modules: ModuleRef[]) {
  const all = modules.flatMap((m) => m.lessons);
  const lastIndex = Math.max(0, all.findIndex((l) => l.id === progress.lastLesson));
  const ordered = [...all.slice(lastIndex), ...all.slice(0, lastIndex)];
  return (ordered.find((l) => !lessonStatus(progress, l).complete) ?? all[0])?.id;
}
