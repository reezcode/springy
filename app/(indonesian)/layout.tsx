import type { Metadata, Viewport } from 'next';
import { buildSearchIndex, getOutline } from '@/content';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SearchDialog } from '@/components/layout/search-dialog';
import { SidebarContent } from '@/components/layout/sidebar';
import { motionScript } from '@/hooks/use-motion';
import { RewardCelebration } from '@/components/gamification/reward-celebration';
import { themeScript } from '@/components/layout/theme-toggle';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'Springy · Belajar Java & Spring Boot', template: '%s · Springy' },
  description: 'Belajar Java dan Spring Boot dalam bahasa Indonesia, dari OOP sampai microservices. Ada contoh kode, latihan, dan playground untuk mencoba konsepnya.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f14' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const outline = getOutline();
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg">
          Langsung ke konten
        </a>
        <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="sticky top-0 hidden h-dvh overflow-y-auto border-r border-border bg-surface lg:block">
            <SidebarContent outline={outline} />
          </aside>
          <div className="min-w-0">
            <MobileNav outline={outline} />
            <main id="main" tabIndex={-1} className="focus:outline-none">
              {children}
            </main>
          </div>
        </div>
        <SearchDialog index={buildSearchIndex()} />
        <RewardCelebration outline={outline} />
      </body>
    </html>
  );
}
