## Batas berdasarkan kemampuan bisnis

Cara paling umum yang keliru memecah sistem adalah berdasarkan lapisan teknis (service "database", service "UI") atau berdasarkan tabel (service `customer`, service `address`). Keduanya menghasilkan service yang harus selalu berubah bersama.

Batas yang lebih tahan lama mengikuti **kemampuan bisnis**: hal yang dilakukan bisnis dan relatif stabil walau teknologinya berubah.

| Kemampuan bisnis | Service | Memiliki data |
| --- | --- | --- |
| Menerima pesanan | Order | order, item, status, idempotency record |
| Mengelola stok | Inventory | stok, reservasi |
| Memberi kabar pelanggan | Notification | template, log pengiriman |

## Satu data, satu pemilik

Prinsip terpenting: **setiap data punya tepat satu service pemilik.** Hanya pemilik yang boleh menulisnya, dan idealnya hanya pemilik yang membacanya langsung dari database. Service lain mendapat data lewat:

- **API** milik pemilik, misalnya `GET /stock/{sku}`, untuk kebutuhan sinkron.
- **Event** yang diterbitkan pemilik, misalnya `StockChanged`, untuk menyimpan salinan lokal yang dibutuhkan.

```text
           ┌───────────────┐   GET /stock/{sku}   ┌──────────────────┐
           │ Order service │ ───────────────────► │ Inventory service│
           │   orders DB   │ ◄─── StockChanged ── │   inventory DB   │
           └───────────────┘      (event)         └──────────────────┘
                 ✗ tidak ada query langsung ke tabel milik service lain
```

> [!WARNING] Database bersama = kontrak tersembunyi
> Jika Order men-query tabel `stock` milik Inventory secara langsung, skema tabel itu menjadi kontrak publik yang tidak terdokumentasi. Inventory tidak bisa me-rename kolom atau memecah tabel tanpa merusak Order, dan deployment independen pun hilang.

## Bounded context

Dalam Domain-Driven Design, **bounded context** adalah batas di mana sebuah model dan istilahnya punya arti yang konsisten. Kata yang sama bisa bermakna berbeda di konteks berbeda:

| Istilah | Di Order | Di Inventory |
| --- | --- | --- |
| Produk | Nama, harga saat dipesan | SKU, lokasi rak, jumlah fisik |
| Reservasi | Tidak dikenal | Stok yang ditahan sementara untuk order |

Jangan memaksa satu model `Product` raksasa yang dipakai semua service. Setiap service memodelkan apa yang ia butuhkan.

## Mendeteksi batas yang salah

Tanda-tanda batas perlu ditinjau ulang:

- Hampir setiap fitur mengubah dua service yang sama dan keduanya harus dirilis bersama.
- Satu request pengguna memicu rantai panjang panggilan sinkron.
- Service A sering butuh data internal B dan meminta endpoint baru setiap minggu.
- Ada transaksi yang "harus" atomik lintas dua service.

Jika dua bagian selalu berubah bersama dan butuh konsistensi kuat, mungkin keduanya memang satu service.

> [!TIP] Mulai dari jalur penting
> Petakan alur "pelanggan membuat order" dari ujung ke ujung. Catat siapa yang memutuskan apa, data apa yang dibaca dan ditulis, dan di mana konsistensi kuat benar-benar dibutuhkan. Batas yang baik biasanya terlihat dari peta itu.
