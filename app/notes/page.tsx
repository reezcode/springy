import type { Metadata } from 'next';
import { getOutline } from '@/content';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { NotesList } from '@/components/progress/notes-list';

export const metadata: Metadata = { title: 'Catatan saya' };

export default function NotesPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Catatan saya" title="Yang sudah kamu pahami." description="Catatan dan bukti praktik dari setiap materi, dikumpulkan di satu tempat." />
      <div className="mt-8">
        <NotesList outline={getOutline()} />
      </div>
    </PageContainer>
  );
}
