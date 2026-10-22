## Tiga sinyal, tiga pertanyaan

| Sinyal | Menjawab | Bentuk | Biaya |
| --- | --- | --- | --- |
| **Metrics** | Seberapa sering? Seberapa lama? Berapa banyak? | Angka teragregasi per waktu | Murah, cocok untuk alert |
| **Logs** | Apa yang terjadi pada kejadian ini? | Catatan kejadian dengan konteks | Mahal pada volume tinggi |
| **Traces** | Di mana waktu dan error terjadi dalam satu request lintas service? | Pohon span | Sedang, biasanya di-sampling |

Alur investigasi yang umum: **metrics** memicu alert ("error rate naik"), **trace** menunjukkan service dan langkah yang bermasalah, **log** dari trace itu menjelaskan detailnya.

## Metrics dengan Micrometer

Spring Boot memakai **Micrometer** sebagai fasad metrics, mirip SLF4J untuk logging. Tanpa menulis kode, kamu sudah mendapat metrics JVM, pool koneksi, dan HTTP server (`http.server.requests` dengan tag `method`, `uri`, `status`, `outcome`).

Metrics bisnis kustom:

```java
@Service
class PlaceOrder {
  private final OrderRepository orders;
  private final Counter created;
  private final Timer reservationTimer;

  PlaceOrder(OrderRepository orders, MeterRegistry registry) {
    this.orders = orders;
    this.created = registry.counter("orders.created");
    this.reservationTimer = registry.timer("inventory.reservation");
  }

  public Long handle(CreateOrderRequest request) {
    reservationTimer.record(() -> reserveStock(request));
    Order order = orders.save(new Order(request.product(), request.quantity()));
    created.increment();
    return order.getId();
  }
}
```

| Jenis | Untuk |
| --- | --- |
| Counter | Hal yang hanya bertambah: order dibuat, pesan diproses |
| Gauge | Nilai saat ini: panjang antrean, koneksi aktif |
| Timer | Durasi dan jumlah: latensi panggilan Inventory |
| DistributionSummary | Distribusi nilai non-waktu: ukuran payload |

Ekspor ke Prometheus dengan menambahkan `micrometer-registry-prometheus` dan mengekspos endpoint `prometheus`.

> [!WARNING] Kardinalitas tag
> Setiap kombinasi nilai tag menjadi time series sendiri. Tag `status=201` aman; tag `orderId=...` atau `email=...` menciptakan jutaan series dan bisa menjatuhkan backend metrics. Simpan identitas seperti itu di log atau trace, bukan di tag.

## Log yang berguna

```java
private static final Logger log = LoggerFactory.getLogger(PlaceOrder.class);

log.info("Order created orderId={} items={}", order.getId(), request.quantity());
log.warn("Inventory reservation failed sku={} reason={}", sku, e.getMessage());
```

- Gunakan **placeholder** `{}` daripada konkatenasi string, sehingga pesan hanya diformat jika level aktif.
- Pilih level dengan sengaja: `ERROR` untuk yang butuh tindakan, `WARN` untuk anomali yang tertangani, `INFO` untuk kejadian bisnis penting, `DEBUG` untuk detail diagnosis.
- Spring Boot 3.4+ mendukung **log terstruktur** (JSON) bawaan: `logging.structured.format.console=ecs` atau `logstash`. Log JSON mudah dicari di sistem seperti Elasticsearch atau Loki.

Dengan Micrometer Tracing aktif, trace ID dan span ID otomatis dimasukkan ke MDC dan bisa ditampilkan di setiap baris log. Itu yang menghubungkan log dengan trace.

> [!WARNING] Jangan menulis rahasia dan data pribadi
> Token, password, header `Authorization`, nomor kartu, dan data pribadi pelanggan tidak boleh masuk log. Log disalin ke banyak sistem, disimpan lama, dan diakses banyak orang. Jika perlu korelasi, catat ID internal.

## Kapan memakai yang mana

| Pertanyaan | Sinyal |
| --- | --- |
| Apakah p95 latensi checkout naik setelah rilis? | Metrics (timer) |
| Kenapa order 8812 gagal? | Log dicari berdasarkan orderId atau trace ID |
| Request ini lambat di Order, Inventory, atau database? | Trace |
| Berapa pesan yang menumpuk di antrean? | Metrics (gauge) |
