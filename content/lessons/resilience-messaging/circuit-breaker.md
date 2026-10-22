## Menghentikan call ke dependency yang bermasalah

Timeout membatasi berapa lama satu panggilan menunggu. Tetapi jika Inventory sedang bermasalah, setiap request ke Order tetap menunggu sampai timeout, berkali-kali, sambil menambah beban ke Inventory yang sedang kesulitan. **Circuit breaker** menghentikan siklus itu: setelah jumlah kegagalan melewati threshold yang ditentukan, panggilan berikutnya langsung ditolak.

Namanya diambil dari sekring listrik: saat arus berbahaya terdeteksi, sirkuit diputus untuk melindungi sistem.

## Tiga state

```text
         failure rate ≥ ambang
 CLOSED ───────────────────────► OPEN
   ▲                               │
   │ probe berhasil                │ waitDurationInOpenState habis
   │                               ▼
   └──────────────────────────  HALF_OPEN
          probe gagal → kembali OPEN
```

| State | Perilaku |
| --- | --- |
| CLOSED | Panggilan diteruskan. Hasilnya dicatat dalam *sliding window*. |
| OPEN | Panggilan ditolak seketika (`CallNotPermittedException`), dependency tidak dipanggil. |
| HALF_OPEN | Sejumlah kecil panggilan percobaan diizinkan untuk menguji pemulihan. |

## Konfigurasi Resilience4j

```yaml title="application.yml"
resilience4j:
  circuitbreaker:
    instances:
      inventory:
        slidingWindowType: COUNT_BASED
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        failureRateThreshold: 50
        waitDurationInOpenState: 10s
        permittedNumberOfCallsInHalfOpenState: 2
        slowCallDurationThreshold: 2s
        slowCallRateThreshold: 50
```

| Properti | Arti |
| --- | --- |
| `slidingWindowType` / `Size` | Berapa panggilan terakhir (atau berapa detik terakhir) yang dinilai |
| `minimumNumberOfCalls` | Sampel minimum sebelum failure rate dihitung |
| `failureRateThreshold` | Persentase gagal yang membuka circuit |
| `waitDurationInOpenState` | Lama OPEN sebelum HALF_OPEN |
| `permittedNumberOfCallsInHalfOpenState` | Jumlah panggilan percobaan |
| `slowCall...` | Panggilan lambat juga bisa dihitung sebagai masalah |

> [!TIP] Kenapa minimumNumberOfCalls penting
> Tanpanya, jika panggilan pertama setelah start gagal, failure rate langsung 100% dan circuit terbuka karena satu kebetulan.

## Fallback

```java
@CircuitBreaker(name = "inventory", fallbackMethod = "stockUnknown")
public StockLevel stock(String sku) {
  return inventoryGateway.stock(sku);
}

private StockLevel stockUnknown(String sku, Throwable cause) {
  return StockLevel.unknown(sku);   // UI menampilkan "cek ketersediaan nanti"
}
```

Fallback yang baik bergantung pada kebutuhan bisnis: data cache yang belum sepenuhnya terbaru, nilai default yang aman, atau error jelas yang menyatakan layanan sementara tidak tersedia. Fallback **tidak boleh** berpura-pura sukses untuk operasi penting, misalnya menganggap stok tersedia lalu menerima order.

## Pola-pola pendamping

| Pola | Melindungi dari |
| --- | --- |
| Timeout | Menunggu tanpa batas |
| Retry | Kegagalan sementara |
| Circuit breaker | Terus memanggil dependency yang bermasalah |
| Bulkhead | Satu dependency menghabiskan semua thread atau koneksi |
| Rate limiter | Mengirim terlalu banyak request per detik |

Urutan dekorasi yang umum: retry di luar, lalu circuit breaker, lalu timeout di panggilan paling dalam. Saat circuit OPEN, retry sebaiknya tidak terus mencoba; konfigurasikan `CallNotPermittedException` sebagai exception yang diabaikan oleh retry.

> [!NOTE] Simulasi di playground
> Lab "Circuit breaker" memakai window 4 panggilan, minimum 4, ambang 50%, OPEN 10 detik virtual, dan 1 probe. Modelnya sengaja disederhanakan tanpa slow call dan concurrency.
