## Tujuan capstone

Capstone menggabungkan semua yang sudah kamu pelajari menjadi satu sistem kecil yang berjalan. Hasil akhirnya bukan hanya kode, tetapi **bukti**: desain tertulis, test untuk jalur gagal, image yang bisa dijalankan, dan dokumentasi yang bisa diikuti orang lain.

## Mini Commerce

```text
                ┌──────────────┐  POST /reservations  ┌─────────────────┐
 Klien ──JWT──► │ Order service│ ───────────────────► │ Inventory service│
                │  orders DB   │ ◄──────── 201/409 ── │  inventory DB    │
                └──────┬───────┘                      └─────────────────┘
                       │ outbox → OrderConfirmed
                       ▼
                 [ RabbitMQ ]
                       │
                       ▼
             ┌────────────────────┐
             │ Notification worker│  (consumer idempotent)
             └────────────────────┘
```

Tiga komponen sudah cukup untuk menghadapi masalah nyata: komunikasi sinkron yang bisa gagal, konsistensi lintas service, dan pesan yang bisa terduplikasi.

## Langkah 1: tulis alur bisnis

Mulai dari sudut pandang pengguna, bukan teknologi:

1. Pelanggan membuat order berisi produk dan jumlah.
2. Sistem memastikan stok tersedia dan menahannya.
3. Order dikonfirmasi.
4. Pelanggan menerima notifikasi.

Lalu tulis variasinya: stok habis, Inventory tidak merespons, klien mengirim ulang request, notifikasi gagal dikirim.

## Langkah 2: ownership data

| Data | Pemilik | Pembaca lain | Cara akses |
| --- | --- | --- | --- |
| Order, item, status | Order | Notification | Event `OrderConfirmed` |
| Idempotency key | Order | — | — |
| Stok, reservasi | Inventory | Order | `POST /reservations` |
| Log pengiriman notifikasi | Notification | — | — |

## Langkah 3: kontrak

Tulis kontrak lengkap untuk setiap interaksi, termasuk jalur gagal:

```http title="POST /orders"
POST /orders
Authorization: Bearer <jwt dengan scope orders:write>
Idempotency-Key: <uuid>
Content-Type: application/json

{"product":"SKU-001","quantity":2}

201 Created     + Location: /orders/{id}
400 Bad Request   body tidak valid (ProblemDetail + errors)
401 / 403         token tidak ada / scope kurang
409 Conflict      stok habis, atau key dipakai untuk payload lain
503 Unavailable   Inventory tidak merespons dalam batas waktu
```

```json title="Event OrderConfirmed v1"
{
  "id": "6f1c…",              // ID event, untuk deduplikasi
  "type": "OrderConfirmed",
  "occurredAt": "2026-10-22T03:15:00Z",
  "orderId": 42,
  "customerId": "user-123"
}
```

## Langkah 4: ADR

Catat setidaknya tiga keputusan: kenapa Inventory dipisah, kenapa Notification lewat event (bukan HTTP), dan bagaimana konsistensi order–stok dijaga (misalnya reservasi sinkron + outbox untuk event).

> [!TIP] Definition of done capstone
> - Order dan Inventory punya ownership data jelas.
> - API memvalidasi input dan membatasi akses.
> - Retry aman, timeout terukur, consumer idempotent.
> - Migrasi, unit test, dan integration test lulus.
> - Image bisa dijalankan dengan Docker atau Podman.
> - Logs, health, dan alur gagal bisa diperiksa.
> - README berisi cara run, test, deploy, dan recovery.
> - Opsional: deploy ke sandbox OpenShift dengan Route TLS.
