## Pembagian controller, service, dan repository

Struktur yang umum di aplikasi Spring Boot memisahkan kode berdasarkan tanggung jawabnya:

```text
HTTP request
    │
    ▼
@RestController   → terjemahkan HTTP ⇄ panggilan method
    │
    ▼
@Service          → alur use case dan aturan bisnis
    │
    ▼
@Repository       → simpan dan ambil data
```

Dependency hanya mengalir ke bawah. Service tidak tahu soal HTTP; repository tidak tahu soal aturan bisnis.

## Controller pertama

```java title="GreetingController.java"
@RestController
public class GreetingController {
  private final GreetingService service;

  public GreetingController(GreetingService service) {
    this.service = service;
  }

  @GetMapping("/greetings/{name}")
  public String greet(@PathVariable String name) {
    return service.greet(name);
  }
}
```

- `@RestController` = `@Controller` + `@ResponseBody`: return value ditulis langsung sebagai body response. Object akan diubah ke JSON oleh Jackson.
- `@GetMapping` memetakan HTTP GET pada path tertentu ke method.
- `@PathVariable` mengambil bagian path; `@RequestParam` mengambil query string (`?lang=id`).

## Service berisi aturan

```java title="GreetingService.java"
@Service
public class GreetingService {
  public String greet(String name) {
    var trimmed = name.strip();
    if (trimmed.isEmpty()) {
      throw new IllegalArgumentException("Nama wajib diisi");
    }
    return "Halo, " + trimmed + "!";
  }
}
```

Karena service tidak bergantung pada HTTP, aturannya bisa dites dengan unit test biasa:

```java
@Test
void trimsName() {
  assertEquals("Halo, Adi!", new GreetingService().greet("  Adi "));
}
```

## Mencoba endpoint

```shell
./mvnw spring-boot:run
curl -i http://localhost:8080/greetings/Adi
# HTTP/1.1 200
# Halo, Adi!
```

## Tanda controller menangani terlalu banyak hal

> [!WARNING] Code smell di controller
> - Ada `if` yang memutuskan aturan bisnis (diskon, status, persetujuan).
> - Controller memanggil repository langsung untuk operasi yang punya aturan.
> - Controller membuka transaksi atau menyusun query.
> - Logika yang sama perlu disalin ke message consumer atau scheduled job.

Jika salah satu muncul, pindahkan logikanya ke service.

## Bukan aturan jumlah layer

Struktur tiga layer adalah titik awal yang baik, bukan dogma. Untuk endpoint yang hanya membaca data tanpa aturan, controller → repository bisa saja cukup. Untuk domain yang kaya, aturan bisnis sebaiknya ada di domain object (`order.confirm()`), dan service hanya mengatur alur. Yang penting: **setiap bagian punya satu alasan berubah dan dependency mengalir ke arah yang konsisten.**

> [!TIP] Package by feature
> Daripada package `controller/`, `service/`, `repository/` untuk seluruh aplikasi, pertimbangkan package per fitur: `order/`, `inventory/`. Class yang berubah bersama berada di package yang sama, dan kelak lebih mudah dipisah menjadi service sendiri.
