## Kegagalan sementara vs permanen

Tidak semua kegagalan sama. Sebagian hilang sendiri dalam hitungan milidetik; sebagian akan selalu gagal sampai ada yang diubah.

| Sementara (layak di-retry) | Permanen (jangan di-retry) |
| --- | --- |
| Timeout koneksi atau response | 400 Bad Request |
| 503 Service Unavailable, 429 Too Many Requests | 401/403 |
| Koneksi di-reset saat deployment | 404, 409 karena aturan bisnis |

Mengulang kegagalan permanen hanya menambah beban dan menunda error yang seharusnya langsung terlihat.

## Retry dengan batas dan backoff

Retry tanpa batas dan tanpa jeda bisa memperparah keadaan: dependency yang kelebihan beban dibanjiri request ulangan dari semua klien sekaligus (*retry storm*). Aturan dasarnya:

- **Batasi jumlah percobaan**, misalnya 3 termasuk percobaan pertama.
- **Beri jeda yang bertambah** (exponential backoff): 200ms, 400ms, 800ms.
- **Tambahkan jitter** (acak kecil) agar klien tidak mengulang di detik yang sama.
- **Hormati batas waktu total**: retry tidak boleh membuat pengguna menunggu lebih lama dari timeout use case.

Dengan Resilience4j di Spring Boot:

```yaml title="application.yml"
resilience4j:
  retry:
    instances:
      inventory:
        maxAttempts: 3
        waitDuration: 200ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        retryExceptions:
          - org.springframework.web.client.ResourceAccessException
        ignoreExceptions:
          - com.example.order.OutOfStockException
```

```java
@Retry(name = "inventory")
public ReservationResult reserve(String sku, int qty) {
  return inventoryGateway.reserve(sku, qty);
}
```

> [!NOTE] Butuh integrasi yang sesuai
> Anotasi `@Retry` membutuhkan modul Resilience4j untuk Spring Boot (misalnya `resilience4j-spring-boot3`) dan dukungan AOP. Konfigurasi YAML saja tidak memasang apa pun. Cocokkan versi modul dengan versi Spring Boot-mu.

## Timeout bukan berarti gagal

Saat klien mengalami timeout pada `POST /orders`, ada tiga kemungkinan:

1. Request tidak pernah sampai ke server.
2. Server sedang memproses dan akan berhasil.
3. Server sudah berhasil, tetapi response hilang di jalan.

Klien **tidak bisa membedakannya**. Jika ia mengulang POST, kemungkinan 2 dan 3 menghasilkan order ganda dan pelanggan ditagih dua kali.

## Idempotency key

Solusinya: klien membuat ID unik untuk setiap *operasi logis* dan mengirimkannya di setiap percobaan.

```http
POST /orders
Idempotency-Key: 7c1e9f0a-1d0b-4f61-9a5e-1a7b3c2d4e5f
Content-Type: application/json

{"product":"Book","quantity":1}
```

Server mencatat key bersama hasilnya:

| Kondisi | Respons |
| --- | --- |
| Key baru | Proses, simpan key + hasil, kembalikan 201 |
| Key sama, payload sama | Jangan proses lagi; kembalikan hasil yang tersimpan |
| Key sama, payload berbeda | 409 Conflict (atau 422): key dipakai ulang untuk operasi lain |

```sql title="V4__idempotency_keys.sql"
create table idempotency_keys (
  key          varchar(100) primary key,
  fingerprint  varchar(64)  not null,  -- hash payload
  order_id     bigint       not null,
  created_at   timestamptz  not null default now()
);
```

Penyimpanan key dan pembuatan order harus **dalam transaksi yang sama**, dan primary key mencegah dua request serentak dengan key sama sama-sama lolos.

> [!WARNING] Map di memori tidak cukup
> `ConcurrentHashMap` hanya hidup di satu instans. Dengan dua replica di belakang load balancer, retry bisa mendarat di replica lain yang tidak mengenal key tersebut. Key juga hilang saat restart. Simpan di database bersama, dan tetapkan masa retensi (misalnya 24 jam).

> [!TIP] Coba di playground
> Lab "REST API & idempotency" memperlihatkan respons 201, replay 200, dan konflik 409 untuk key yang sama.
