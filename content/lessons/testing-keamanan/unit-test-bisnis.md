## Piramida test

Setiap jenis test punya cakupan dan waktu eksekusi berbeda. Susunan yang umum dipakai:

| Jenis | Menguji | Kecepatan | Jumlah |
| --- | --- | --- | --- |
| Unit test | Aturan bisnis di service/domain, tanpa Spring | Milidetik | Banyak |
| Integration test | Beberapa komponen + infrastruktur nyata (DB, broker) | Detik | Sedang |
| End-to-end | Seluruh sistem lewat API/UI | Menit | Sedikit |

Modul ini dimulai dari dasar piramida: unit test untuk memeriksa aturan bisnis sebelum dan sesudah refactor.

## JUnit 5 dan Arrange–Act–Assert

`spring-boot-starter-test` sudah membawa JUnit 5, AssertJ, dan Mockito.

```java title="CheckoutTest.java"
class CheckoutTest {

  @Test
  void memberGetsTenPercentDiscount() {
    // Arrange
    var gateway = new FakeGateway();
    var checkout = new Checkout(new MemberDiscount(), gateway);

    // Act
    checkout.pay(100_000);

    // Assert
    assertEquals(90_000, gateway.lastAmount);
  }

  @Test
  void rejectsNegativeTotal() {
    var ex = assertThrows(IllegalArgumentException.class,
        () -> new Order(new BigDecimal("-1")));
    assertTrue(ex.getMessage().contains("negatif"));
  }
}
```

- **Arrange**: siapkan object dan fake.
- **Act**: jalankan *satu* aksi yang diuji.
- **Assert**: periksa hasil yang terlihat dari luar.

Beri nama test sesuai perilaku (`memberGetsTenPercentDiscount`), bukan nama method (`testPay`). Saat gagal, namanya langsung menjelaskan apa yang rusak.

> [!TIP] Tidak perlu Spring
> Karena service memakai constructor injection, kamu cukup `new`. Tidak ada `@SpringBootTest`, tidak ada ApplicationContext, dan test selesai dalam milidetik.

## Fake, stub, dan mock

| Jenis | Perilaku | Cocok untuk |
| --- | --- | --- |
| Fake | Implementasi sederhana yang berfungsi (repository in-memory) | Dependency milikmu sendiri |
| Stub | Mengembalikan jawaban yang sudah ditentukan | Mengatur skenario |
| Mock | Merekam interaksi untuk diverifikasi | Memastikan side effect terjadi |

Dengan Mockito:

```java
var gateway = mock(PaymentGateway.class);
doThrow(new PaymentFailedException()).when(gateway).charge(anyLong());

var checkout = new Checkout(new NoDiscount(), gateway);

assertThrows(PaymentFailedException.class, () -> checkout.pay(50_000));
verify(gateway).charge(50_000);
```

> [!WARNING] Terlalu banyak mock
> Jika test memverifikasi setiap panggilan internal, test akan rusak setiap kali implementasi di-refactor walau perilakunya sama. Uji **hasil yang penting bagi pengguna**, dan mock hanya di batas sistem (pembayaran, email, HTTP eksternal).

## Test yang deterministik

Test yang kadang lulus dan kadang gagal tanpa perubahan kode disebut *flaky test*. Hasil seperti ini menyulitkan tim membedakan bug dari masalah pada test. Sumber umum ketidakpastian dan solusinya:

| Sumber | Solusi |
| --- | --- |
| Waktu sekarang | Inject `Clock`, pakai `Clock.fixed(...)` di test |
| Angka acak / UUID | Inject generator |
| Jaringan | Fake atau stub di batas sistem |
| Urutan eksekusi test | Jangan berbagi state mutable antartest |

```java
@Service
class PromoService {
  private final Clock clock;
  PromoService(Clock clock) { this.clock = clock; }

  boolean isPromoDay() {
    return LocalDate.now(clock).getDayOfMonth() == 25;
  }
}

// di test
var clock = Clock.fixed(Instant.parse("2026-10-25T03:00:00Z"), ZoneId.of("Asia/Jakarta"));
assertTrue(new PromoService(clock).isPromoDay());
```

## Menjalankan

```shell
./mvnw test
./mvnw test -Dtest=CheckoutTest
```
