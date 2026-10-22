## Kenapa messaging?

Tidak semua interaksi butuh jawaban seketika. Saat order dikonfirmasi, Notification cukup tahu bahwa ia perlu mengirim email. Order tidak perlu menunggu email terkirim. Dengan **message broker** seperti RabbitMQ, Order menerbitkan event `OrderConfirmed` dan langsung lanjut. Notification memprosesnya ketika siap, bahkan jika sedang mati sesaat.

```text
Order ──publish──► [exchange] ──route──► [queue: order-confirmed] ──deliver──► Notification
```

Order dan Notification tidak harus aktif pada waktu yang sama. Queue menampung pesan saat beban naik, dan consumer baru bisa ditambahkan tanpa mengubah Order.

## Publisher confirm dan consumer acknowledgement

Pengiriman pesan punya dua titik rawan, dan RabbitMQ menyediakan mekanisme berbeda untuk masing-masing.

| Mekanisme | Menjawab pertanyaan | Pihak |
| --- | --- | --- |
| **Publisher confirm** | "Apakah broker sudah menerima dan menangani pesanku?" | Publisher ↔ broker |
| **Consumer acknowledgement** | "Apakah consumer sudah selesai memproses pesan ini?" | Broker ↔ consumer |

Tanpa publisher confirm, publisher tidak tahu apakah pesan hilang karena broker restart. Tanpa ack manual yang tepat, broker tidak tahu apakah pekerjaan benar-benar selesai.

## Kapan melakukan ack?

| Strategi | Jika consumer crash di tengah | Akibat |
| --- | --- | --- |
| Ack sebelum memproses | Broker sudah menghapus pesan | **Pekerjaan hilang** |
| Ack setelah memproses | Broker mengirim ulang pesan | **Pekerjaan bisa terulang** |

Pekerjaan hilang tidak bisa dipulihkan; pekerjaan terulang bisa ditangani. Karena itu ack dilakukan **setelah** pemrosesan selesai. Spring AMQP dengan acknowledge mode `AUTO` (default) melakukan ack setelah listener selesai tanpa exception, dan menolak pesan jika listener melempar exception.

> [!WARNING] Requeue tanpa batas
> Pesan yang selalu gagal diproses (*poison message*) akan dikirim ulang terus-menerus jika selalu di-requeue. Batasi percobaan dan arahkan pesan gagal ke **dead-letter queue** untuk diperiksa manusia.

## At-least-once berarti duplikat

Kombinasi publisher confirm + ack setelah proses menghasilkan jaminan **at-least-once**: setiap pesan diproses minimal sekali, mungkin lebih. Duplikat bisa muncul karena:

- Consumer crash setelah memproses tetapi sebelum ack.
- Publisher mengirim ulang karena confirm tidak sampai.
- Relay outbox mengirim ulang (materi berikutnya).

Jaminan exactly-once end-to-end membutuhkan koordinasi tambahan dan tidak cukup hanya dengan konfigurasi broker. Yang realistis adalah **at-least-once delivery + consumer idempotent**.

## Consumer idempotent

```java title="OrderConfirmedListener.java"
@Component
class OrderConfirmedListener {
  private final ProcessedMessageRepository processed;
  private final Notifier notifier;

  // constructor...

  @RabbitListener(queues = "order-confirmed")
  @Transactional
  public void on(OrderConfirmed event) {
    if (processed.existsById(event.id())) {
      return;   // sudah pernah diproses, abaikan
    }
    notifier.send(event.customerId(), event.orderId());
    processed.save(new ProcessedMessage(event.id()));
  }
}
```

- Setiap event membawa **ID unik** yang ditetapkan penerbit, bukan dibuat ulang oleh consumer.
- Tabel `processed_messages` memiliki primary key pada ID, sehingga dua consumer yang memproses duplikat bersamaan tidak sama-sama lolos.
- Efek ke sistem eksternal (email, pembayaran) tetap bisa terulang jika crash terjadi tepat di antara `send` dan `save`. Kurangi risikonya dengan meneruskan ID event sebagai idempotency key ke penyedia eksternal.

> [!TIP] Rancang event yang bisa diproses ulang
> Event yang membawa keadaan akhir ("order 42 sekarang CONFIRMED") lebih aman diproses ulang daripada event yang membawa delta ("tambah 1 ke jumlah konfirmasi").
