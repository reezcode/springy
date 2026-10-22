## DTO: kontrak publik API

**DTO** (Data Transfer Object) adalah object yang membentuk request dan response. Ia sengaja dipisah dari **entity** persistence karena keduanya berubah dengan alasan berbeda:

- Entity mengikuti struktur database dan aturan domain.
- DTO mengikuti kebutuhan klien dan harus stabil.

Mengekspos entity langsung berisiko membocorkan field internal (misalnya `passwordHash`), membuat lazy loading terpicu saat serialisasi JSON, dan mengunci skema database ke kontrak publik.

```java
public record CreateOrderRequest(String product, int quantity) {}

public record OrderResponse(long id, String product, int quantity, String status) {
  static OrderResponse from(Order order) {
    return new OrderResponse(order.getId(), order.getProduct(), order.getQuantity(), order.getStatus().name());
  }
}
```

## Bean Validation

Dependency `spring-boot-starter-validation` membawa Hibernate Validator, implementasi standar Jakarta Bean Validation. Constraint dideklarasikan sebagai anotasi:

```java
import jakarta.validation.constraints.*;

public record CreateOrderRequest(
    @NotBlank @Size(max = 100) String product,
    @Min(1) @Max(1000) int quantity,
    @Email String customerEmail) {}
```

| Anotasi | Memastikan |
| --- | --- |
| `@NotNull` | Nilai tidak null |
| `@NotBlank` | String tidak null dan tidak hanya spasi |
| `@NotEmpty` | Collection/String tidak null dan tidak kosong |
| `@Size(min, max)` | Panjang String atau ukuran collection |
| `@Min`, `@Max`, `@Positive` | Rentang angka |
| `@Email`, `@Pattern` | Format teks |

## Mengaktifkan validasi dengan @Valid

Constraint tidak berjalan sendiri. Tambahkan `@Valid` pada parameter controller:

```java
@PostMapping
ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
  // hanya dieksekusi jika request valid
}
```

Jika gagal, Spring melempar `MethodArgumentNotValidException` dan merespons **400 Bad Request** sebelum service dipanggil. Di materi berikutnya kamu akan membentuk body error-nya agar memuat daftar field yang salah.

> [!WARNING] Lupa @Valid adalah bug yang diam
> Tanpa `@Valid`, anotasi `@NotBlank` di DTO hanyalah dekorasi. Tidak ada error, tidak ada peringatan, dan data tidak valid masuk ke service. Buktikan dengan test yang mengirim body tidak valid.

## Validasi format vs aturan bisnis

| Validasi format (DTO) | Aturan bisnis (service/domain) |
| --- | --- |
| Bisa diputuskan hanya dari isi request | Butuh data atau state lain |
| `product` wajib, `quantity ≥ 1` | Stok cukup, order belum dibatalkan |
| Bean Validation → 400 | Exception domain → 409/422 |

Keduanya diperlukan. Bean Validation menyaring input buruk sejak pintu masuk; aturan bisnis tetap ditegakkan di service karena berlaku juga untuk jalur non-HTTP.

> [!TIP] Validasi di klien bukan pengganti
> Form di frontend boleh memvalidasi untuk kenyamanan pengguna, tetapi server tetap harus memvalidasi. Request bisa dikirim langsung tanpa melewati frontend.
