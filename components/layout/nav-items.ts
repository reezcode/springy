import { BookOpen, FlaskConical, Home, Library, NotebookPen, Settings, type LucideIcon } from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean };

export const navItems: NavItem[] = [
  { href: '/', label: 'Beranda', icon: Home, match: (p) => p === '/' },
  { href: '/modules/', label: 'Learning path', icon: BookOpen, match: (p) => p.startsWith('/modules') },
  { href: '/playground/', label: 'Playground', icon: FlaskConical, match: (p) => p.startsWith('/playground') },
  { href: '/references/', label: 'Referensi', icon: Library, match: (p) => p.startsWith('/references') },
  { href: '/notes/', label: 'Catatan saya', icon: NotebookPen, match: (p) => p.startsWith('/notes') },
  { href: '/settings/', label: 'Pengaturan', icon: Settings, match: (p) => p.startsWith('/settings') },
];
