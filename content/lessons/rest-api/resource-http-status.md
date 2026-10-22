## Resource sebagai kata benda

REST memodelkan API sebagai kumpulan **resource** yang diberi alamat (URL). Aksi terhadap resource dinyatakan oleh **HTTP method**, bukan oleh nama di URL.

| Kurang baik | Lebih baik |
| --- | --- |
| `POST /createOrder` | `POST /orders` |
| `GET /getOrderById?id=42` | `GET /orders/42` |
| `POST /orders/42/delete` | `DELETE /orders/42` |

Gunakan bentuk jamak untuk koleksi (`/orders`) dan ID untuk elemen (`/orders/{id}`). Relasi bisa dinyatakan dengan sub-resource: `/orders/42/items`.

## Method dan semantiknya

| Method | Kegunaan | Safe | Idempotent |
| --- | --- | --- | --- |
| GET | Membaca resource | Ya | Ya |
| POST | Membuat resource / memicu proses | Tidak | Tidak |
| PUT | Mengganti seluruh resource | Tidak | Ya |
| PATCH | Mengubah sebagian resource | Tidak | Tidak dijamin |
| DELETE | Menghapus resource | Tidak | Ya |

- **Safe**: tidak mengubah state server. Browser, cache, dan crawler boleh memanggilnya kapan saja.
- **Idempotent**: mengirim request yang sama berkali-kali menghasilkan state server yang sama seperti sekali kirim. Ini penting ketika jaringan putus dan klien mengulang request.

> [!WARNING] GET tidak boleh mengubah data
> Endpoint seperti `GET /orders/42/cancel` berbahaya: prefetch browser, crawler, atau retry otomatis bisa membatalkan order tanpa sengaja.

## Memilih HTTP status code

| Status | Arti | Contoh |
| --- | --- | --- |
| 200 OK | Sukses dengan body | GET order |
| 201 Created | Resource baru dibuat | POST order, sertakan `Location` |
| 204 No Content | Sukses tanpa body | DELETE order |
| 400 Bad Request | Request tidak valid | JSON rusak, field wajib kosong |
| 401 Unauthorized | Belum terautentikasi | Token tidak ada / tidak valid |
| 403 Forbidden | Terautentikasi tapi tidak berizin | Scope kurang |
| 404 Not Found | Resource tidak ada | Order 999 |
| 409 Conflict | Bentrok dengan state saat ini | Order sudah dibatalkan |
| 500 Internal Server Error | Bug atau kegagalan tak terduga di server | Exception tak tertangani |

Aturan ringkas: **4xx berarti klien perlu mengubah request; 5xx berarti server yang bermasalah.** Mengembalikan 200 dengan body `{"error": ...}` menyulitkan klien, monitoring, dan retry.

## Implementasi dengan Spring

```java title="OrderController.java"
@RestController
@RequestMapping("/orders")
class OrderController {
  private final OrderService service;

  OrderController(OrderService service) {
    this.service = service;
  }

  @GetMapping("/{id}")
  OrderResponse get(@PathVariable long id) {
    return service.find(id);   // lempar OrderNotFoundException → 404 (lihat materi 3)
  }

  @PostMapping
  ResponseEntity<OrderResponse> create(@RequestBody CreateOrderRequest request) {
    OrderResponse order = service.create(request);
    return ResponseEntity
        .created(URI.create("/orders/" + order.id()))
        .body(order);
  }
}
```

`ResponseEntity` memberi kendali penuh atas status, header, dan body. Untuk kasus sederhana yang selalu 200, cukup kembalikan object-nya.

```shell
curl -i -X POST http://localhost:8080/orders \
  -H 'Content-Type: application/json' \
  -d '{"product":"Book","quantity":1}'
# HTTP/1.1 201
# Location: /orders/1
```

> [!TIP] Coba di playground
> Lab "REST API & idempotency" mensimulasikan endpoint ini lengkap dengan 201, 400, 401, 404, dan 409.
