import { currentStreak, localDay, type Progress } from './schema.ts';
import { overallStatus, type ModuleRef } from './selectors.ts';

export const XP_PER_QUESTION = 20;
export const XP_PER_LESSON = 50;
export const XP_PER_MODULE = 150;
export const DAILY_GOAL = 2;

export const LEVELS = [
  { xp: 0, name: 'Tunas baru' },
  { xp: 100, name: 'Coder penasaran' },
  { xp: 350, name: 'Java explorer' },
  { xp: 800, name: 'API builder' },
  { xp: 1500, name: 'Service crafter' },
  { xp: 2600, name: 'Container captain' },
  { xp: 4200, name: 'Cloud ranger' },
  { xp: 6000, name: 'Springy scholar' },
] as const;

/** Calendar-day history keeps the streak badge earned after a later missed day. */
export function longestStreak(activity: Progress['activity']) {
  let previous = '', run = 0, best = 0;
  for (const day of Object.keys(activity).filter(d => activity[d] > 0 && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()) {
    const [year, month, date] = day.split('-').map(Number);
    const cursor = new Date(year, month - 1, date);
    if (localDay(cursor) !== day) continue;
    cursor.setDate(cursor.getDate() - 1);
    run = localDay(cursor) === previous ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

/** Rewards are derived from canonical results: replays and unknown IDs cannot inflate XP. */
export function rewardStatus(progress: Progress, modules: ModuleRef[], today = new Date()) {
  const overall = overallStatus(progress, modules);
  const xp = overall.exercisesPassed * XP_PER_QUESTION + overall.lessonsComplete * XP_PER_LESSON + overall.modulesComplete * XP_PER_MODULE;
  const index = LEVELS.findLastIndex(l => xp >= l.xp);
  const level = LEVELS[Math.max(0, index)];
  const nextLevel = LEVELS[index + 1];
  const streak = currentStreak(progress.activity, today);
  const bestStreak = longestStreak(progress.activity);
  const todayCount = Math.min(DAILY_GOAL, Math.max(0, progress.activity[localDay(today)] ?? 0));
  const badges = [
    { id: 'spark', name: 'Percikan pertama', description: 'Jawab satu soal dengan benar.', unlocked: overall.exercisesPassed >= 1, progress: Math.min(1, overall.exercisesPassed), total: 1, icon: 'spark' },
    { id: 'bloom', name: 'Mulai mekar', description: 'Selesaikan satu materi.', unlocked: overall.lessonsComplete >= 1, progress: Math.min(1, overall.lessonsComplete), total: 1, icon: 'flower' },
    { id: 'master', name: 'Module master', description: 'Selesaikan satu modul.', unlocked: overall.modulesComplete >= 1, progress: Math.min(1, overall.modulesComplete), total: 1, icon: 'medal' },
    { id: 'streak', name: 'Lagi semangat', description: 'Belajar selama tiga hari berturut-turut.', unlocked: bestStreak >= 3, progress: Math.min(3, bestStreak), total: 3, icon: 'flame' },
    { id: 'halfway', name: 'Setengah jalan', description: 'Selesaikan setengah dari seluruh materi.', unlocked: overall.lessonsComplete >= Math.ceil(overall.lessonsTotal / 2) && overall.lessonsTotal > 0, progress: Math.min(Math.ceil(overall.lessonsTotal / 2), overall.lessonsComplete), total: Math.ceil(overall.lessonsTotal / 2), icon: 'flag' },
    { id: 'scholar', name: 'Mekar penuh', description: 'Selesaikan seluruh learning path.', unlocked: overall.lessonsComplete === overall.lessonsTotal && overall.lessonsTotal > 0, progress: overall.lessonsComplete, total: overall.lessonsTotal, icon: 'crown' },
  ] as const;
  return {
    ...overall, xp, level: index + 1, levelName: level.name, nextLevel,
    levelPercent: nextLevel ? Math.round(((xp - level.xp) / (nextLevel.xp - level.xp)) * 100) : 100,
    xpToNext: nextLevel ? nextLevel.xp - xp : 0,
    streak, bestStreak, todayCount, dailyComplete: todayCount >= DAILY_GOAL, badges,
  };
}

