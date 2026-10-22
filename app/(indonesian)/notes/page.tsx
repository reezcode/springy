import type { Metadata } from 'next';
import { getOutline } from '@/content';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { NotesList } from '@/components/progress/notes-list';

export const metadata: Metadata = { title: 'Catatan saya' };

export default function NotesPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Catatan saya" title="Catatan belajarmu." description="Lihat lagi catatan, tautan repo, dan hasil percobaan yang kamu simpan di tiap materi." />
      <div className="mt-8">
        <NotesList outline={getOutline()} />
      </div>
    </PageContainer>
  );
}
