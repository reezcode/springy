## Unit kerja yang atomik

Banyak use case melibatkan lebih dari satu perubahan. Membuat order bisa berarti menyimpan order, menyimpan item, dan mencatat audit. Jika langkah kedua gagal, langkah pertama tidak boleh tertinggal sendirian. **Transaksi** menjamin sifat ACID; yang paling terasa di sini adalah **atomicity**: semua berhasil, atau semua dibatalkan.

## @Transactional

```java
@Service
class PlaceOrder {
  private final OrderRepository orders;
  private final AuditRepository audits;

  // constructor...

  @Transactional
  public Long handle(CreateOrderRequest request) {
    Order order = orders.save(new Order(request.product(), request.quantity()));
    audits.save(new AuditEntry("ORDER_CREATED", order.getId()));
    return order.getId();
  }
}
```

Spring membuka transaksi sebelum method berjalan, lalu melakukan **commit** jika method selesai normal atau **rollback** jika melempar exception yang memenuhi aturan rollback.

> [!TIP] Tempatkan di service
> Pasang `@Transactional` pada method service yang mewakili satu use case bisnis. Controller terlalu luar karena tahu soal HTTP; repository terlalu dalam karena hanya satu operasi.

## Aturan rollback default

| Exception | Default |
| --- | --- |
| `RuntimeException` dan turunannya | Rollback |
| `Error` | Rollback |
| Checked exception (`IOException`, `Exception`) | **Commit** |

Untuk mengubahnya: `@Transactional(rollbackFor = Exception.class)`. Lebih baik lagi, gunakan unchecked exception untuk kegagalan bisnis sehingga perilakunya konsisten.

## Dirty checking

Entity yang dimuat di dalam transaksi berada dalam **persistence context**. Hibernate mengingat keadaannya dan, saat commit, menulis perubahan secara otomatis:

```java
@Transactional
public void confirm(Long id) {
  Order order = orders.findById(id).orElseThrow(() -> new OrderNotFoundException(id));
  order.confirm();   // tidak perlu orders.save(order)
}
```

## Jebakan proxy: self-invocation

`@Transactional` diterapkan lewat **proxy**. Spring membungkus bean-mu dengan object lain yang membuka dan menutup transaksi. Panggilan dari luar melewati proxy; panggilan internal lewat `this` tidak.

```java title="Transaksi tidak aktif untuk place()"
@Service
class OrderService {
  public void placeAll(List<CreateOrderRequest> requests) {
    requests.forEach(this::place);   // memanggil langsung, melewati proxy
  }

  @Transactional
  public void place(CreateOrderRequest request) { ... }
}
```

Perbaikan: pasang `@Transactional` pada `placeAll`, atau pindahkan `place` ke bean lain yang di-inject.

> [!WARNING] Jangan lakukan I/O lambat di dalam transaksi
> Memanggil HTTP service lain atau mengirim email di dalam method transactional menahan koneksi database dan lock selama panggilan berlangsung. Jika panggilan lambat, pool koneksi habis. Lakukan panggilan eksternal di luar transaksi, atau gunakan pola outbox (modul 8).

## Batasnya: satu datasource

Transaksi ini **lokal**: hanya mencakup satu database. Ia tidak bisa membatalkan panggilan HTTP yang sudah dikirim ke Inventory service atau pesan yang sudah diterbitkan ke broker. Konsistensi lintas service membutuhkan pola lain seperti outbox dan saga, yang dibahas di modul Resilience & messaging.

## Read-only

Untuk method yang hanya membaca, `@Transactional(readOnly = true)` memberi petunjuk optimasi ke Hibernate dan driver, misalnya melewati dirty checking.
