'use client';

import { Download, RotateCcw, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@/hooks/use-progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MotionToggle } from '@/components/layout/motion-toggle';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export function SettingsPanel() {
  const { progress, actions } = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  function download() {
    const url = URL.createObjectURL(new Blob([actions.exportJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `springy-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: 'Backup progres berhasil diunduh.' });
  }

  async function importFile(f?: File) {
    if (!f) return;
    let ok = false;
    try {
      ok = f.size <= 2_000_000 && actions.importJson(await f.text());
    } catch {
      ok = false;
    }
    setMessage(ok ? { ok: true, text: 'Progres dari file berhasil digabung dengan progresmu.' } : { ok: false, text: 'File tidak valid. Pilih file ekspor Springy (.json, maks. 2 MB).' });
    if (file.current) file.current.value = '';
  }

  const passed = Object.values(progress.exercises).filter((r) => r.passed).length;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Cadangkan progres</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Hasil latihan, penanda praktik, dan catatan tersimpan otomatis di browser ini tanpa akun. Data tidak tersinkron antarperangkat dan hilang jika data situs dihapus.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={download}><Download className="size-4" /> Ekspor JSON</Button>
          <Button variant="secondary" onClick={() => file.current?.click()}><Upload className="size-4" /> Impor JSON</Button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importFile(e.target.files?.[0])} />
        </div>
        <p className="mt-4 text-xs text-fg-subtle">Saat impor, hasil latihan yang sudah benar tetap tersimpan. Catatan untuk materi yang sama akan diganti dengan catatan dari file. File ekspor versi lama juga bisa dipakai.</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Tampilan</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Pilih tema terang, gelap, atau ikuti pengaturan sistem.</p>
        <ThemeToggle className="mt-5" />
        <div className="mt-5 border-t border-border pt-3"><MotionToggle /></div>
        <p className="mt-2 text-xs leading-relaxed text-fg-subtle">Mode tenang mematikan gerakan dan confetti. Preferensi reduced motion dari perangkat selalu diikuti.</p>
      </Card>

      <Card className="p-6 md:col-span-2">
        <h2 className="text-lg font-semibold">Mulai dari awal</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Hapus semua hasil latihan, penanda praktik, dan catatan di browser ini. Ekspor dulu jika ingin menyimpan salinan.</p>
        {confirming ? (
          <div role="alertdialog" aria-label="Konfirmasi reset" className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4">
            <p className="flex-1 text-sm">Hapus {passed} latihan benar dan {Object.keys(progress.notes).length} catatan? Tindakan ini tidak bisa dibatalkan.</p>
            <Button variant="danger" onClick={() => { actions.resetAll(); setConfirming(false); setMessage({ ok: true, text: 'Progres direset.' }); }}>Ya, hapus</Button>
            <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>Batal</Button>
          </div>
        ) : (
          <Button variant="secondary" className="mt-5" onClick={() => setConfirming(true)}><RotateCcw className="size-4" /> Reset progres</Button>
        )}
      </Card>

      <div aria-live="polite" className="md:col-span-2">
        {message && <p className={`rounded-xl px-4 py-3 text-sm ${message.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{message.text}</p>}
      </div>
    </div>
  );
}
