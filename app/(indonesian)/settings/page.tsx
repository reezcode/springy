import type { Metadata } from 'next';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { SettingsPanel } from '@/components/progress/settings-panel';

export const metadata: Metadata = { title: 'Pengaturan' };

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Pengaturan" title="Atur tampilan dan progres belajarmu." />
      <div className="mt-8">
        <SettingsPanel />
      </div>
    </PageContainer>
  );
}
