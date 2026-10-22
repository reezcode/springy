## Apa itu microservices?

James Lewis dan Martin Fowler (2014) menggambarkan gaya arsitektur microservices sebagai pendekatan membangun satu aplikasi dari **kumpulan service kecil**, masing-masing berjalan di prosesnya sendiri dan berkomunikasi lewat mekanisme ringan seperti HTTP. Service dibangun di sekitar **kemampuan bisnis** dan bisa **di-deploy secara independen** dengan otomasi.

Beberapa karakteristik yang mereka uraikan:

- Komponen sebagai service, bukan library.
- Diorganisasi berdasarkan kemampuan bisnis, bukan lapisan teknis.
- "Smart endpoints and dumb pipes": logika di service, bukan di bus pesan.
- Tata kelola dan pengelolaan data yang terdesentralisasi.
- Otomasi infrastruktur dan desain yang memperhitungkan kegagalan.

## Monolith tidak selalu buruk

| | Monolith (modular) | Microservices |
| --- | --- | --- |
| Deployment | Satu unit | Banyak unit, independen |
| Panggilan antarbagian | Method call (cepat, andal) | Jaringan (lambat, bisa gagal) |
| Transaksi | ACID lokal mudah | Konsistensi terdistribusi (saga, outbox) |
| Skala | Seluruh aplikasi | Per service |
| Observability | Satu log, satu stack trace | Tracing terdistribusi wajib |
| Kebutuhan operasional | Rendah | Tinggi: CI/CD, platform container, monitoring |
| Kepemilikan tim | Bisa bentrok di codebase besar | Batas jelas per tim |

**Modular monolith** adalah satu aplikasi yang di dalamnya terbagi menjadi modul dengan batas tegas: setiap modul punya API internal, datanya sendiri, dan tidak mengakses detail modul lain. Ini memberi sebagian besar manfaat desain microservices tanpa biaya jaringan.

## Kapan memisahkan?

Alasan yang kuat biasanya bersifat organisasi atau operasional:

1. Tim berbeda perlu merilis dengan ritme berbeda tanpa saling menunggu.
2. Satu bagian butuh skala atau sumber daya yang sangat berbeda.
3. Satu bagian butuh isolasi kegagalan atau keamanan yang lebih ketat.
4. Teknologi yang berbeda benar-benar dibutuhkan untuk satu bagian.

Alasan yang lemah: "semua perusahaan besar memakainya", "supaya modern", atau "agar kodenya rapi". Kerapian bisa dicapai dengan modul.

> [!WARNING] Distributed monolith
> Memecah aplikasi tanpa batas yang tepat menghasilkan *distributed monolith*: service yang harus dirilis bersama, saling memanggil secara berantai, dan berbagi database. Kamu menanggung semua biaya microservices tanpa mendapat manfaatnya.

## Mencatat keputusan: ADR

**Architecture Decision Record** adalah dokumen pendek yang mencatat satu keputusan penting:

```text title="docs/adr/0001-pisahkan-inventory.md"
# 1. Pisahkan Inventory dari Order

Status: Diterima (2026-10-22)

## Konteks
Stok diperbarui oleh sistem gudang setiap menit dan butuh skala berbeda
dari pemesanan. Tim gudang ingin merilis tanpa menunggu tim pemesanan.

## Keputusan
Inventory menjadi service terpisah dengan database sendiri. Order
mengakses stok lewat HTTP dan event StockChanged.

## Konsekuensi
+ Rilis dan skala independen.
- Reservasi stok tidak lagi dalam satu transaksi dengan order (butuh saga).
- Perlu timeout, retry, dan tracing antarservice.
```

Enam bulan lagi, ADR menjawab pertanyaan "kenapa dulu kita memilih ini?" tanpa bergantung pada ingatan siapa pun.

> [!TIP] Kasus latihan: Mini Commerce
> Sepanjang modul ini kita memakai tiga bagian: **Order** (pemesanan), **Inventory** (stok dan reservasi), dan **Notification** (mengirim pesan ke pelanggan). Ukurannya cukup kecil untuk dipahami, tetapi cukup untuk merasakan masalah nyata sistem terdistribusi.
