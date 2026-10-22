## Definisi selesai

Sebelum menyerahkan project, pastikan orang lain bisa menjalankan aplikasi, menjalankan test, memeriksa error, dan melakukan recovery dengan mengikuti README. Gunakan checklist di bawah untuk memeriksa apa yang masih perlu dilengkapi.

## Struktur README

```text title="README.md (kerangka)"
# Mini Commerce

## Ringkasan
Apa yang dilakukan sistem dan diagram singkatnya.

## Prasyarat
Java 21, Docker/Podman, (opsional) oc CLI.

## Menjalankan lokal
docker compose up -d --build
Alamat setiap service dan cara mendapatkan token latihan.

## Test
./mvnw verify (butuh runtime container untuk Testcontainers)
Daftar skenario kegagalan dan cara menjalankannya.

## Observability
Health, metrics, tracing (alamat Jaeger/Zipkin), cara mencari log dengan trace ID.

## Deploy
Langkah build, push, deploy, dan verifikasi.

## Recovery
Rollback, memproses ulang outbox, dead-letter queue.

## Keterbatasan yang diketahui
Apa yang belum dikerjakan dan risikonya.

## Keputusan arsitektur
Tautan ke docs/adr/.
```

## Known limitations

Setiap sistem punya keterbatasan. Catat dampak dan rencana penanganannya. Contoh:

| Keterbatasan | Dampak | Rencana |
| --- | --- | --- |
| Outbox relay hanya aman untuk satu replica | Event bisa terkirim ganda jika di-scale | `SKIP LOCKED` atau leader election |
| Tidak ada kompensasi otomatis untuk pembayaran | Butuh tindakan manual | Saga dengan Payment service |
| Token latihan dibuat dengan issuer lokal | Bukan konfigurasi produksi | Integrasi identity provider |

## Uji di lingkungan bersih

Minta seseorang (rekan, mentor, atau dirimu sendiri di mesin/VM baru) mengikuti README dari awal tanpa bantuan. Catat setiap kali mereka bingung atau gagal. Setiap catatan adalah perbaikan dokumentasi.

## Checklist review

- [ ] Service boundary dan ownership data sesuai desain tertulis.
- [ ] Semua endpoint memvalidasi input dan menegakkan authorization.
- [ ] Panggilan antarservice punya timeout; retry hanya untuk operasi aman.
- [ ] Consumer idempotent dan ada dead-letter queue.
- [ ] Migrasi berjalan di database kosong dan versi sebelumnya.
- [ ] Unit test, integration test, dan test skenario gagal lulus di CI.
- [ ] Image non-root, tanpa secret, dengan tag yang bisa dilacak.
- [ ] Health, metrics, dan trace tersedia; log tanpa data sensitif.
- [ ] README diuji oleh orang lain di lingkungan bersih.

> [!TIP] Setelah capstone
> Pilih satu area untuk didalami: event streaming dengan Kafka, Kubernetes/OpenShift lebih lanjut (Helm, GitOps), keamanan aplikasi, atau performa JVM. Fondasi dari learning path ini membuat topik lanjutan jauh lebih mudah dipahami.
