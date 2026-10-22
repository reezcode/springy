## Error yang bisa dibaca mesin

Klien API, baik frontend maupun service lain, perlu memproses error secara otomatis. Format yang berbeda-beda per endpoint memaksa setiap klien menulis parser khusus. **RFC 9457 Problem Details** (penerus RFC 7807) mendefinisikan format standar dengan Content-Type `application/problem+json`:

```json
{
  "type": "https://api.example.com/problems/order-not-found",
  "title": "Order tidak ditemukan",
  "status": 404,
  "detail": "Order 42 tidak ditemukan",
  "instance": "/orders/42"
}
```

| Field | Isi |
| --- | --- |
| `type` | URI yang mengidentifikasi jenis masalah (default `about:blank`) |
| `title` | Ringkasan singkat jenis masalah |
| `status` | Status HTTP |
| `detail` | Penjelasan untuk kejadian spesifik ini |
| `instance` | URI kejadian / request terkait |

Kamu boleh menambahkan properti sendiri, misalnya `errors` berisi daftar field yang tidak valid.

## ProblemDetail di Spring

Spring Framework 6 menyediakan class `ProblemDetail`. Aktifkan juga format ini untuk error bawaan Spring MVC (400 validasi, 405, 415, dan lainnya):

```yaml title="application.yml"
spring:
  mvc:
    problemdetails:
      enabled: true
```

## Memusatkan pemetaan dengan @RestControllerAdvice

```java title="ApiExceptionHandler.java"
@RestControllerAdvice
class ApiExceptionHandler {

  @ExceptionHandler(OrderNotFoundException.class)
  ProblemDetail handleNotFound(OrderNotFoundException ex) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    problem.setTitle("Order tidak ditemukan");
    problem.setType(URI.create("https://api.example.com/problems/order-not-found"));
    return problem;
  }

  @ExceptionHandler(OrderAlreadyCancelledException.class)
  ProblemDetail handleConflict(OrderAlreadyCancelledException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
  }
}
```

Controller dan service cukup melempar exception domain. Pemetaan ke HTTP hanya ada di satu tempat sehingga konsisten untuk semua endpoint.

## Menambahkan detail field validasi

Untuk 400 akibat Bean Validation, klien butuh tahu field mana yang salah. Dengan memperluas `ResponseEntityExceptionHandler`, kamu bisa menambahkan properti `errors`:

```java
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {
  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
    ProblemDetail problem = ex.getBody();
    problem.setProperty("errors", ex.getFieldErrors().stream()
        .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage()))
        .toList());
    return ResponseEntity.status(status).body(problem);
  }
}
```

## Jangan membocorkan detail internal

> [!WARNING] Yang tidak boleh sampai ke klien
> Stack trace, pesan SQL, nama tabel, path file server, versi library, dan isi exception yang tidak kamu kendalikan. Informasi ini membantu penyerang memetakan sistemmu.

Untuk error tak terduga, kirim pesan generik dan **ID korelasi**, lalu log detail lengkap di server dengan ID yang sama:

```java
@ExceptionHandler(Exception.class)
ProblemDetail handleUnexpected(Exception ex) {
  String ref = UUID.randomUUID().toString().substring(0, 8);
  log.error("Unexpected error ref={}", ref, ex);
  ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Terjadi kesalahan. Kode referensi: " + ref);
  problem.setProperty("reference", ref);
  return problem;
}
```

Spring Boot juga menyembunyikan stack trace dari response secara default (`server.error.include-stacktrace=never`). Jangan ubah pengaturan itu di produksi.
