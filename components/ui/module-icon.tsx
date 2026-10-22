import { Activity, Box, Braces, ChartNoAxesCombined, Coffee, Database, Layers, Leaf, Network, Rocket, Shapes, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { IconName, Tint } from '@/content/types';
import { cn } from '@/lib/cn';

const icons: Record<IconName, LucideIcon> = {
  coffee: Coffee,
  shapes: Shapes,
  leaf: Leaf,
  braces: Braces,
  database: Database,
  shield: ShieldCheck,
  network: Network,
  activity: Activity,
  chart: ChartNoAxesCombined,
  box: Box,
  layers: Layers,
  rocket: Rocket,
};

export const tintClass: Record<Tint, string> = {
  peach: 'bg-tint-peach text-tint-peach-fg',
  lavender: 'bg-tint-lavender text-tint-lavender-fg',
  mint: 'bg-tint-mint text-tint-mint-fg',
  blue: 'bg-tint-blue text-tint-blue-fg',
  yellow: 'bg-tint-yellow text-tint-yellow-fg',
};

export function ModuleIcon({ icon, tint, size = 'md', className }: { icon: IconName; tint: Tint; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const Icon = icons[icon];
  const box = { sm: 'size-8 rounded-lg [&_svg]:size-4', md: 'size-10 rounded-xl [&_svg]:size-5', lg: 'size-14 rounded-2xl [&_svg]:size-7' }[size];
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center', box, tintClass[tint], className)}>
      <Icon />
    </span>
  );
}
