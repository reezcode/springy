## Bangun secara bertahap

Jangan membangun semuanya sekaligus. Urutan yang mengurangi risiko:

1. **Order sendirian**: API, validasi, persistensi, migrasi, test. (Modul 3–6)
2. **Inventory sendirian**: API reservasi dan test-nya.
3. **Hubungkan secara sinkron**: `RestClient` dengan timeout, pemetaan error. (Modul 7)
4. **Tambahkan resilience**: idempotency key, retry terbatas, circuit breaker. (Modul 8)
5. **Tambahkan event**: outbox di Order, consumer idempotent di Notification. (Modul 8)
6. **Observability**: health, metrics, tracing lintas service. (Modul 9)

Setiap tahap harus lulus test sebelum lanjut ke tahap berikutnya.

## Matriks skenario kegagalan

| Skenario | Cara memicu | Hasil yang diharapkan | Bukti |
| --- | --- | --- | --- |
| Inventory mati | `docker compose stop inventory` | Order merespons 503 dalam ≤ 2 detik | Test dengan WireMock/stub yang lambat, log waktu respons |
| Inventory lambat | Stub dengan delay 5 detik | Timeout, lalu circuit breaker OPEN setelah ambang | Metrics `resilience4j.circuitbreaker.state` |
| Klien retry POST | Kirim request sama dua kali dengan key sama | Satu order, response kedua replay | Integration test |
| Key dipakai ulang | Key sama, payload beda | 409 | Integration test |
| Event terduplikasi | Kirim `OrderConfirmed` dengan ID sama dua kali | Satu notifikasi | Integration test dengan Testcontainers RabbitMQ |
| Gagal di tengah transaksi | Paksa exception setelah `orders.save` | Tidak ada order tersimpan | Integration test |
| Broker mati saat order dibuat | Matikan RabbitMQ | Order tetap tersimpan; event terkirim setelah broker hidup | Baris outbox terisi lalu `published_at` terisi |

## Contoh: test timeout Inventory

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class InventoryTimeoutTest {

  @RegisterExtension
  static WireMockExtension inventory = WireMockExtension.newInstance()
      .options(wireMockConfig().dynamicPort()).build();

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry registry) {
    registry.add("inventory.base-url", inventory::baseUrl);
    registry.add("inventory.timeout", () -> "1s");
  }

  @Test
  void respondsWithin_timeout_whenInventoryIsSlow() {
    inventory.stubFor(post("/reservations")
        .willReturn(aResponse().withFixedDelay(5_000)));

    long start = System.nanoTime();
    var response = placeOrder();                      // helper yang memanggil POST /orders
    long ms = (System.nanoTime() - start) / 1_000_000;

    assertThat(response.getStatusCode().value()).isEqualTo(503);
    assertThat(ms).isLessThan(2_500);
  }
}
```

> [!NOTE] Simulasi vs bukti nyata
> Playground di Springpath membantu memahami konsep seperti circuit breaker dan idempotency. Untuk capstone, bukti harus berasal dari aplikasimu sendiri: test yang lulus, log, atau metrics dari sistem yang berjalan.

## Catat hasil percobaan manual

Untuk skenario yang sulit diotomatiskan (misalnya mematikan broker), tulis catatan yang bisa diulang:

```text
Skenario : Broker mati saat order dibuat
Langkah  : 1) docker compose stop rabbitmq
           2) curl POST /orders (201)
           3) select count(*) from outbox where published_at is null  → 1
           4) docker compose start rabbitmq, tunggu 5 detik
           5) query yang sama → 0; log Notification menerima event
Hasil    : Sesuai harapan (2026-10-22)
```
