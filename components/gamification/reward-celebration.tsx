'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { Outline } from '@/content';
import { useProgress } from '@/hooks/use-progress';
import { rewardStatus } from '@/lib/progress/rewards';
import { SpringyMascot } from '@/components/ui/springy-mascot';

type Notice = { id: number; xp: number; title: string; message: string };

export function RewardCelebration({ outline }: { outline: Outline }) {
  const { progress, hydrated } = useProgress();
  const rewards = useMemo(() => rewardStatus(progress, outline), [progress, outline]);
  const previous = useRef<{ xp: number; level: number; lessons: number; modules: number; daily: boolean } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const before = previous.current;
    previous.current = { xp: rewards.xp, level: rewards.level, lessons: rewards.lessonsComplete, modules: rewards.modulesComplete, daily: rewards.dailyComplete };
    // Loading saved progress is not a new achievement. Resets also do not earn XP.
    if (!before || rewards.xp <= before.xp) return;
    let title = 'Jawaban benar!';
    let message = 'Satu langkah lebih dekat. Lanjutkan!';
    if (rewards.dailyComplete && !before.daily) { title = 'Daily quest selesai!'; message = 'Dua soal baru hari ini. Kerja bagus!'; }
    if (rewards.lessonsComplete > before.lessons) { title = 'Materi selesai!'; message = 'Semua soal di materi ini sudah kamu jawab benar.'; }
    if (rewards.modulesComplete > before.modules) { title = 'Modul selesai!'; message = 'Satu modul penuh. Springy ikut bangga!'; }
    if (rewards.level > before.level) { title = 'Naik level!'; message = rewards.levelName; }
    setNotice({ id: Date.now(), xp: rewards.xp - before.xp, title, message });
  }, [hydrated, rewards]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;
  return (
    <>
      <div key={notice.id} className="celebration-particles pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--particle': i } as CSSProperties} />)}
      </div>
      <div key={`toast-${notice.id}`} className="reward-toast fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-accent/25 bg-surface p-4 shadow-pop sm:right-6 sm:bottom-6 sm:left-auto" data-testid="reward-toast">
        <SpringyMascot interactive={false} happy className="w-16" />
        <div role="status" aria-live="polite" className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-bold text-accent-text"><Sparkles className="size-3.5" aria-hidden="true" /> +{notice.xp} XP</p>
          <p className="mt-0.5 font-semibold">{notice.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{notice.message}</p>
        </div>
        <button type="button" aria-label="Tutup perayaan" onClick={() => setNotice(null)} className="self-start rounded-lg p-1.5 text-fg-muted hover:bg-subtle"><X className="size-4" aria-hidden="true" /></button>
      </div>
    </>
  );
}
