## Masalah dual write

Setelah order disimpan, Order perlu menerbitkan `OrderCreated`. Implementasi langsungnya mungkin seperti ini:

```java
@Transactional
public Long place(CreateOrderRequest request) {
  Order order = orders.save(new Order(...));
  rabbitTemplate.convertAndSend("orders", "order.created", new OrderCreated(order.getId()));
  return order.getId();
}
```

Ada penulisan ke dua sistem (database dan broker) tanpa transaksi yang mencakup keduanya:

| Kejadian | Akibat |
| --- | --- |
| Publish berhasil, lalu commit DB gagal | Event untuk order yang tidak ada |
| Commit DB berhasil, publish gagal / aplikasi crash | Order ada, tetapi tidak ada yang tahu |

Mengganti urutan tidak menyelesaikan masalah; hanya memindahkan jenis inkonsistensinya.

## Transactional outbox

Ide pola **outbox**: jangan publish langsung. Tulis event ke tabel `outbox` **di database yang sama, dalam transaksi yang sama** dengan perubahan bisnis. Proses terpisah (relay) membaca tabel itu dan memublikasikannya.

```sql title="V5__outbox.sql"
create table outbox (
  id            uuid primary key,
  type          varchar(100) not null,
  payload       jsonb        not null,
  created_at    timestamptz  not null default now(),
  published_at  timestamptz
);
```

```java
@Transactional
public Long place(CreateOrderRequest request) {
  Order order = orders.save(new Order(request.product(), request.quantity()));
  outbox.save(OutboxMessage.of("order.created", new OrderCreated(order.getId())));
  return order.getId();   // order dan event: commit bersama atau batal bersama
}
```

```java title="OutboxRelay.java (disederhanakan)"
@Scheduled(fixedDelay = 1000)
@Transactional
public void publishPending() {
  for (OutboxMessage m : outbox.findTop100ByPublishedAtIsNullOrderByCreatedAt()) {
    rabbitTemplate.convertAndSend("orders", m.getType(), m.getPayload());
    m.markPublished();
  }
}
```

Relay bisa berupa scheduler seperti di atas (*polling publisher*) atau *transaction log tailing* dengan alat seperti Debezium yang membaca WAL database.

> [!WARNING] Relay juga bisa mengirim ulang
> Jika relay crash setelah publish tetapi sebelum menandai `published_at`, pesan akan dikirim lagi. Outbox menjamin event **tidak hilang**, bukan bahwa event hanya dikirim sekali. Consumer tetap harus idempotent. Dengan banyak replica, gunakan `SELECT ... FOR UPDATE SKIP LOCKED` atau satu relay aktif agar baris yang sama tidak diproses bersamaan.

## Saga: transaksi bisnis lintas service

Membuat order di Mini Commerce melibatkan tiga service, masing-masing dengan database sendiri. Tidak ada transaksi ACID yang mencakup ketiganya. **Saga** memecah transaksi bisnis menjadi rangkaian **transaksi lokal**; setiap langkah menerbitkan event atau perintah yang memicu langkah berikutnya. Jika satu langkah gagal, saga menjalankan **kompensasi** untuk langkah yang sudah berhasil.

| Langkah | Service | Aksi | Kompensasi |
| --- | --- | --- | --- |
| 1 | Order | Buat order PENDING | Ubah ke CANCELLED |
| 2 | Inventory | Reservasi stok | Lepas reservasi |
| 3 | Payment | Tagih pembayaran | Refund |
| 4 | Order | Ubah ke CONFIRMED | — |

Jika Payment gagal di langkah 3, kompensasi dijalankan mundur: lepas reservasi (2), lalu batalkan order (1).

### Choreography vs orchestration

| | Choreography | Orchestration |
| --- | --- | --- |
| Koordinasi | Setiap service bereaksi terhadap event service lain | Satu orchestrator mengirim perintah ke setiap service |
| Kelebihan | Sederhana untuk alur pendek, tanpa titik pusat | Alur terlihat di satu tempat, mudah dipantau |
| Kekurangan | Alur sulit dilihat secara utuh saat bertambah panjang | Orchestrator bisa menjadi pusat logika yang gemuk |

## Eventual consistency

Selama saga berjalan, sistem berada dalam keadaan "sementara": order PENDING, stok tereservasi, pembayaran belum. Ini **eventual consistency**: data akan konsisten pada akhirnya, bukan seketika. Konsekuensinya bagi desain:

- Tampilkan status antara ke pengguna ("Pesanan sedang diproses").
- Setiap langkah dan kompensasi harus idempotent karena bisa diulang.
- Kompensasi adalah **aksi bisnis baru**, bukan rollback. Email "pesanan dikonfirmasi" yang sudah terkirim tidak bisa ditarik; yang bisa dilakukan adalah mengirim email pembatalan.

> [!NOTE] Mulai dari yang sederhana
> Untuk latihan, choreography dengan tiga event (`OrderCreated`, `StockReserved`/`StockRejected`, `PaymentFailed`) sudah cukup untuk merasakan polanya. Tulis diagram alurnya sebelum menulis kode.
