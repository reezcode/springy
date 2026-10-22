# Springpath

Web pembelajaran microservices dengan Java dan Spring Boot, dari OOP dan SOLID sampai Docker/Podman serta pengenalan OpenShift.

## Isi paket

- Source Next.js App Router, TypeScript, React, dan Tailwind CSS.
- 12 modul, 48 materi lengkap di dalam web, 118 latihan bernilai otomatis, 37 referensi primer, dan 4 playground konsep.
- Folder `out/` berisi hasil build statis yang sudah siap diunggah.
- Dockerfile untuk menyajikan hasil build memakai Nginx.
- Pengujian logika playground dalam `tests/`.

Paket ini berdiri sendiri. Tidak memerlukan Vinext, Cloudflare Workers, koneksi ChatGPT, database, atau kredensial dari situs sebelumnya.

## Menjalankan source

Gunakan Node.js 22.13 atau lebih baru. Versi pnpm tercantum pada `package.json`.

```sh
cd springpath
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Buka http://localhost:3000. Bila Corepack belum tersedia pada instalasi Node, pasang pnpm versi yang tercantum di `package.json` melalui package manager pilihanmu.

Alternatif menggunakan npm:

```sh
npm install
npm run dev
```

Lockfile yang disertakan adalah `pnpm-lock.yaml`. Instalasi npm akan membuat package-lock.json sendiri.

## Build dan pemeriksaan

```sh
pnpm test
pnpm typecheck
pnpm build
```

`pnpm build` menjalankan Next.js dengan Webpack dan menghasilkan folder `out/`. `pnpm test` memeriksa logika grading, progres, parser markdown, playground, **dan seluruh latihan di kurikulum**: setiap contoh solusi harus lulus pemeriksaan dan setiap kode awal harus gagal.

Karena konfigurasi memakai `output: "export"`, deploy hasilnya sebagai situs statis. `next start` tidak digunakan untuk konfigurasi ini.

## Deploy ke hosting statis

1. Untuk deploy tanpa mengubah source, gunakan folder `out/` yang sudah tersedia.
2. Bila mengubah source, install dependency dan jalankan `pnpm build` lagi.
3. Unggah **isi** folder `out/`, termasuk `_next/`, ke document root hosting.
4. Pastikan `index.html` menjadi halaman utama. Pertahankan struktur file dan nama folder.
5. Buka situs melalui HTTP/HTTPS, bukan dengan membuka index.html sebagai file lokal.

Untuk platform hosting yang membangun dari source:

- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output/publish directory: `out`
- Node: 22.13 atau lebih baru
- Environment variable rahasia: tidak diperlukan

Konfigurasi saat ini mengasumsikan situs berada pada root domain, misalnya https://belajar.example.com/. Untuk subfolder seperti /springpath/, atur basePath pada next.config.ts dan perbarui URL favicon sebelum build ulang.

## Deploy dengan Docker atau Podman

Dockerfile menyalin hasil build yang ada di `out/`. Tidak menjalankan instalasi dependency atau membangun source lagi di dalam container.

```sh
# Opsional: build ulang bila source berubah
pnpm build

# Docker
 docker build -t springpath:1.0 .
 docker run -d --name springpath --restart unless-stopped -p 8080:80 springpath:1.0

# Atau Podman
 podman build -t localhost/springpath:1.0 .
 podman run -d --name springpath --restart unless-stopped -p 8080:80 localhost/springpath:1.0
```

Buka http://localhost:8080. Untuk penggunaan lewat internet, arahkan domain dan HTTPS melalui reverse proxy atau fasilitas hosting yang digunakan. Jalankan salah satu runtime, Docker atau Podman, sesuai lingkunganmu.

## Struktur project

```text
app/                         Route App Router (Server Components secara default)
  page.tsx                   Beranda
  modules/[moduleSlug]/      Ringkasan modul (SSG)
  modules/[moduleSlug]/[lessonSlug]/   Halaman materi (SSG)
  playground/[lab]/          Lab interaktif
  references/ notes/ settings/
components/
  ui/                        Primitive: Button, Badge, Card, ProgressBar
  layout/                    Sidebar, mobile nav, pencarian (/ atau Ctrl/⌘+K), tema
  content/                   Renderer markdown, code block + highlight
  exercises/                 Komponen latihan (pilihan, isian, urutan, kode)
  lesson/ progress/          Komponen halaman materi dan widget progres
content/
  modules/NN-*.ts            Metadata materi, latihan, referensi per modul
  lessons/<modul>/<materi>.md  Isi materi (dibaca saat build)
  sources.ts                 Daftar referensi resmi
features/labs/               Playground
lib/                         Logika murni: grading, progres, markdown, highlight, labs
hooks/use-progress.ts        Store progres (useSyncExternalStore + localStorage)
tests/                       Tes node:test
```

## Menambah atau mengubah materi

1. Tulis isi di `content/lessons/<slug-modul>/<slug-materi>.md`. Gunakan `##` untuk bagian (otomatis masuk daftar isi), blok kode dengan ```` ```java title="File.java" ````, callout `> [!TIP]`, `> [!NOTE]`, `> [!WARNING]`, dan tabel.
2. Tambahkan metadata dan latihan di `content/modules/NN-*.ts`. Jenis latihan: `choice`, `fill`, `order`, `code`.
3. Latihan `code` diperiksa dengan regex terhadap kode tanpa komentar. Setiap latihan wajib punya `solution` yang lulus dan `starter` yang gagal; `pnpm test` menolak jika tidak.
4. Jangan ubah urutan materi yang sudah ada: ID progres (`m1-1`) diturunkan dari posisi.

## Progres dan catatan

Hasil latihan, penanda praktik mandiri, dan catatan tersimpan di localStorage dengan key `springpath-v2`. Materi dianggap lulus bila semua latihannya benar. Data versi lama (`springpath-v1`) dimigrasikan otomatis: checklist lama menjadi penanda praktik. Ekspor/impor JSON tersedia di Pengaturan.

## Playground

Logika ada di `lib/labs.ts`, UI di `features/labs/`. Playground tidak mengompilasi Java, menjalankan JVM/container, atau menghubungi server.
