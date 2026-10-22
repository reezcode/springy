'use client';

import { Award, Check, ChevronDown, Crown, Flag, Flame, Flower2, LockKeyhole, Sparkles, Star, Target } from 'lucide-react';
import { useState } from 'react';
import type { Outline } from '@/content';
import { useProgress } from '@/hooks/use-progress';
import { DAILY_GOAL, rewardStatus } from '@/lib/progress/rewards';
import { cn } from '@/lib/cn';
import { ProgressBar } from '@/components/ui/progress-bar';

const icons = { spark: Sparkles, flower: Flower2, medal: Award, flame: Flame, flag: Flag, crown: Crown };

export function AdventureDashboard({ outline }: { outline: Outline }) {
  const { progress, hydrated } = useProgress();
  const rewards = rewardStatus(progress, outline);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedBadge = rewards.badges.find(b => b.id === selected);
  const unlocked = hydrated ? rewards.badges.filter(b => b.unlocked).length : 0;

  return (
    <section aria-labelledby="adventure-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="adventure-title" className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Sparkles className="size-5 text-accent-text" aria-hidden="true" /> Petualanganmu</h2>
        <span className="text-xs text-fg-muted">20 XP / soal · 50 XP / materi · 150 XP / modul</span>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="xp-card relative isolate overflow-hidden rounded-2xl p-5 text-white sm:p-6">
          <div aria-hidden="true" className="xp-orbit xp-orbit-one" />
          <div aria-hidden="true" className="xp-orbit xp-orbit-two" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-violet-200 uppercase">Level {hydrated ? rewards.level : 1}</p>
              <h3 className="mt-1 text-xl font-bold">{rewards.levelName}</h3>
              <p className="mt-2 text-sm text-violet-100"><strong className="text-2xl font-bold text-white tabular-nums" data-testid="total-xp">{hydrated ? rewards.xp : 0}</strong> XP</p>
            </div>
            <span className="level-medallion flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/10" aria-hidden="true"><Star className="size-8 fill-amber-200 text-amber-200" /></span>
          </div>
          <div className="relative mt-5">
            <div className="mb-2 flex flex-wrap justify-between gap-1 text-xs text-violet-100">
              <span>{rewards.nextLevel ? 'Menuju level berikutnya' : 'Level tertinggi tercapai'}</span>
              {rewards.nextLevel && <span>{rewards.xpToNext} XP lagi</span>}
            </div>
            <div role="progressbar" aria-label="Progres level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={hydrated ? rewards.levelPercent : 0} className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="xp-fill h-full rounded-full bg-amber-200" style={{ width: `${hydrated ? rewards.levelPercent : 0}%` }} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-violet-100">XP dihitung dari progresmu. Mengulang soal yang sudah benar tidak menambah XP.</p>
          </div>
        </div>

        <div className={cn('quest-card relative overflow-hidden rounded-2xl border bg-surface p-5 shadow-card sm:p-6', rewards.dailyComplete && hydrated ? 'border-success/40' : 'border-border')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-widest text-fg-subtle uppercase">Daily quest</p>
              <h3 className="mt-1 text-lg font-semibold">Dua soal hari ini</h3>
            </div>
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', rewards.dailyComplete && hydrated ? 'bg-success-soft text-success' : 'bg-tint-peach text-tint-peach-fg')}>
              {rewards.dailyComplete && hydrated ? <Check className="size-5" aria-hidden="true" /> : <Target className="size-5" aria-hidden="true" />}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">Jawab dua soal baru dengan benar. Sedikit tiap hari juga berarti.</p>
          <div className="mt-5 flex items-center gap-3">
            <ProgressBar value={hydrated ? rewards.todayCount / DAILY_GOAL * 100 : 0} label="Progres daily quest" tone={rewards.dailyComplete ? 'success' : 'accent'} />
            <span className="shrink-0 text-sm font-semibold tabular-nums" data-testid="daily-progress">{hydrated ? rewards.todayCount : 0}/{DAILY_GOAL}</span>
          </div>
          <p className={cn('mt-3 text-xs font-medium', rewards.dailyComplete && hydrated ? 'text-success' : 'text-fg-muted')}>
            {rewards.dailyComplete && hydrated ? 'Quest selesai. Sampai besok!' : 'Mulai dari materi yang sedang kamu pelajari.'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Koleksi badge <span className="ml-1 font-normal text-fg-muted">{unlocked}/{rewards.badges.length}</span></h3>
          <span className="flex items-center gap-1 text-xs text-fg-muted">Ketuk untuk lihat caranya <ChevronDown className="size-3" aria-hidden="true" /></span>
        </div>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {rewards.badges.map((badge, index) => {
            const Icon = icons[badge.icon];
            const earned = hydrated && badge.unlocked;
            return (
              <li key={badge.id}>
                <button type="button" aria-pressed={selected === badge.id} onClick={() => setSelected(s => s === badge.id ? null : badge.id)} className={cn('badge-tile group flex h-full w-full flex-col items-center gap-2 rounded-xl border px-1 py-3 text-center transition-colors', selected === badge.id ? 'border-accent bg-accent-soft' : 'border-transparent hover:bg-subtle')}>
                  <span className={cn('badge-token relative flex size-12 items-center justify-center rounded-2xl border', earned ? `badge-color-${index}` : 'border-border bg-subtle text-fg-subtle')}>
                    <Icon className={cn('size-6', earned && 'badge-earned')} aria-hidden="true" />
                    {!earned && <LockKeyhole className="absolute -right-1 -bottom-1 size-4 rounded-full bg-surface p-0.5 text-fg-subtle" aria-hidden="true" />}
                  </span>
                  <span className={cn('text-xs leading-snug font-medium', !earned && 'text-fg-muted')}>{badge.name}</span>
                  <span className="sr-only">{earned ? 'Terbuka' : 'Terkunci'}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {selectedBadge && (
          <div role="status" className="badge-detail mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-subtle px-4 py-3 text-sm">
            <p><strong>{selectedBadge.name}</strong><span className="mx-2 text-fg-subtle">·</span>{selectedBadge.description}</p>
            <span className="text-xs font-medium text-fg-muted tabular-nums">{hydrated ? selectedBadge.progress : 0}/{selectedBadge.total}</span>
          </div>
        )}
      </div>
    </section>
  );
}
