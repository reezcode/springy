'use client';

import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { containerCommand } from '@/lib/labs';
import { CodeBlock } from '@/components/content/code-block';
import { SourceLink } from '@/components/content/source-link';
import { AsideCard, Field, LabHeading, LabLayout, fieldClass } from './lab-ui';

export function ContainerLab() {
  const [engine, setEngine] = useState('docker');
  const [image, setImage] = useState('order-service:0.1');
  const [port, setPort] = useState('8080');
  const command = containerCommand(engine, image, port);

  return (
    <LabLayout
      main={
        <>
          <LabHeading title="Susun perintah container" badge="COMMAND BUILDER">
            Image harus sudah dibangun atau tersedia di registry. Jalankan hasilnya di terminalmu sendiri.
          </LabHeading>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Runtime">
              <select
                value={engine}
                onChange={(e) => {
                  setEngine(e.target.value);
                  setImage(e.target.value === 'podman' ? 'localhost/order-service:0.1' : 'order-service:0.1');
                }}
                className={fieldClass}
              >
                <option value="docker">Docker</option>
                <option value="podman">Podman</option>
              </select>
            </Field>
            <Field label="Image + tag" className="sm:col-span-2">
              <input value={image} onChange={(e) => setImage(e.target.value)} spellCheck={false} className={`${fieldClass} font-mono`} />
            </Field>
            <Field label="Port host">
              <input type="number" inputMode="numeric" min={1024} max={65535} value={port} onChange={(e) => setPort(e.target.value)} className={fieldClass} />
            </Field>
          </div>
          {command ? (
            <CodeBlock code={command} lang="shell" title="Terminal · perintah yang dihasilkan" />
          ) : (
            <p role="alert" className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">Isi nama image tanpa spasi atau karakter shell, dan port host 1024–65535.</p>
          )}
          <div className="flex flex-wrap items-center gap-2 font-mono text-sm" aria-label="Port mapping">
            <span className="rounded-lg border border-border bg-subtle px-3 py-1.5">127.0.0.1:{port || '?'}</span>
            <ArrowRight className="size-4 text-fg-subtle" aria-hidden="true" />
            <span className="rounded-lg border border-border bg-subtle px-3 py-1.5">container:8080</span>
          </div>
          <CodeBlock lang="shell" title="Terminal · periksa setelah berjalan" code={`${engine} ps\n${engine} logs order-lab\n${engine} inspect order-lab\n# Hentikan container latihan:\n${engine} stop order-lab`} />
        </>
      }
      aside={
        <>
          <AsideCard title="Baca perintahnya">
            <p><b>--rm</b> menghapus container setelah proses berhenti.</p>
            <p><b>--name</b> memberi nama agar mudah diperiksa.</p>
            <p><b>-p 127.0.0.1:host:container</b> memublikasikan port hanya ke loopback host.</p>
            <p className="text-xs">Aplikasi di container harus listen di 0.0.0.0:8080. Di Podman macOS/Windows, jalankan <code>podman machine start</code> dahulu.</p>
          </AsideCard>
          <SourceLink id="podman" />
          <SourceLink id="dockerfile" />
        </>
      }
    />
  );
}
