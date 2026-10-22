## Jaringan bukan method call

Ketika Order memanggil Inventory lewat HTTP, banyak hal bisa terjadi yang tidak pernah terjadi pada method call biasa: koneksi ditolak, DNS gagal, response lambat, response setengah jalan, atau Inventory sedang di-deploy ulang. *Fallacies of distributed computing* mengingatkan bahwa jaringan tidak andal, latensi tidak nol, dan bandwidth tidak tak terbatas.

## RestClient

Spring Framework 6.1 memperkenalkan `RestClient`, klien HTTP sinkron dengan API fluent. Gunakan `RestClient.Builder` yang disediakan Spring Boot karena sudah membawa konfigurasi seperti message converter dan instrumentasi tracing.

```java title="InventoryClientConfig.java"
@Configuration
class InventoryClientConfig {
  @Bean
  RestClient inventoryClient(RestClient.Builder builder, InventoryProperties props) {
    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofSeconds(1));
    factory.setReadTimeout(props.timeout());          // misalnya 2s
    return builder
        .baseUrl(props.baseUrl())
        .requestFactory(factory)
        .build();
  }
}
```

```java title="InventoryGateway.java"
@Component
class InventoryGateway {
  private final RestClient client;

  InventoryGateway(@Qualifier("inventoryClient") RestClient client) {
    this.client = client;
  }

  ReservationResult reserve(String sku, int quantity) {
    return client.post()
        .uri("/reservations")
        .body(new ReservationRequest(sku, quantity))
        .retrieve()
        .onStatus(status -> status.value() == 409, (req, res) -> {
          throw new OutOfStockException(sku);
        })
        .body(ReservationResult.class);
  }
}
```

## Timeout wajib ada

> [!WARNING] Tanpa timeout, satu service lambat bisa menjatuhkan semuanya
> Setiap request masuk ke Order dilayani satu thread. Jika Inventory lambat dan tidak ada timeout, thread-thread Order menunggu tanpa batas. Pool thread habis, Order berhenti melayani request apa pun, termasuk yang tidak butuh Inventory. Kegagalan merambat ke hulu (*cascading failure*).

| Timeout | Membatasi |
| --- | --- |
| Connect timeout | Waktu membuka koneksi TCP |
| Read (response) timeout | Waktu menunggu data setelah terhubung |

Pilih nilai berdasarkan kebutuhan pengguna, bukan tebakan. Jika pengguna menunggu maksimal 3 detik untuk membuat order, panggilan ke Inventory tidak boleh menghabiskan 30 detik.

## Memetakan kegagalan dengan sengaja

Jangan biarkan exception teknis seperti `ResourceAccessException` atau `HttpServerErrorException` bocor sampai ke response Order sebagai 500 tanpa makna. Terjemahkan:

| Kondisi di Inventory | Exception domain di Order | Response Order |
| --- | --- | --- |
| 409 stok habis | `OutOfStockException` | 409 dengan detail SKU |
| Timeout / 5xx | `InventoryUnavailableException` | 503, boleh dicoba lagi |
| 400 | Bug di Order | 500, log dan perbaiki |

## Ketersediaan berantai

Jika Order bergantung secara sinkron pada Inventory dan Payment, dan masing-masing tersedia 99%, maka alur lengkapnya kira-kira hanya tersedia `0,99 × 0,99 × 0,99 ≈ 97%`. Semakin panjang rantai sinkron, semakin rendah ketersediaan dan semakin tinggi latensi total.

Cara menguranginya:

- Pangkas rantai: apakah data ini bisa disalin lokal lewat event?
- Ubah ke asinkron untuk hal yang tidak perlu dijawab seketika, misalnya notifikasi.
- Tambahkan timeout, retry terbatas, dan circuit breaker (modul 8).

> [!TIP] Interface HTTP deklaratif
> Spring juga mendukung *HTTP interface*: deklarasikan interface Java dengan `@GetExchange`/`@PostExchange`, lalu buat implementasinya dari `RestClient` melalui `HttpServiceProxyFactory`. Cocok saat jumlah endpoint mulai banyak.
