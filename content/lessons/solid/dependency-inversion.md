## Membalik arah dependency

Tanpa desain khusus, dependency biasanya mengalir dari kebijakan tingkat tinggi ke detail tingkat rendah:

```text
Checkout  ──►  BankGateway  ──►  HTTP client bank
(aturan bisnis)   (detail teknis)
```

Akibatnya, perubahan pada detail teknis (ganti bank, ganti library HTTP) merambat ke aturan bisnis, dan aturan bisnis tidak bisa dites tanpa bank sungguhan.

**Dependency Inversion Principle** menyatakan:

1. Modul tingkat tinggi tidak boleh bergantung pada modul tingkat rendah. Keduanya bergantung pada abstraksi.
2. Abstraksi tidak bergantung pada detail. Detail yang bergantung pada abstraksi.

```text
Checkout  ──►  PaymentGateway  ◄──  BankGateway
                (abstraksi)          (detail)
```

Arah panah dari `BankGateway` kini terbalik: detail yang menyesuaikan diri dengan kontrak milik bisnis.

## Dari kode yang terikat ke kode yang terbalik

```java title="Sebelum: Checkout membuat detailnya sendiri"
class Checkout {
  private final BankGateway gateway = new BankGateway();

  void pay(long amount) {
    gateway.charge(amount);
  }
}
```

```java title="Sesudah: dependency dari luar, lewat abstraksi"
class Checkout {
  private final PaymentGateway gateway;

  Checkout(PaymentGateway gateway) {
    this.gateway = gateway;
  }

  void pay(long amount) {
    gateway.charge(amount);
  }
}
```

Siapa yang membuat `BankGateway`? Bagian paling luar aplikasi, disebut **composition root**. Pada aplikasi Java biasa itu adalah method `main`; pada Spring Boot itu adalah container IoC.

```java
public static void main(String[] args) {
  PaymentGateway gateway = new BankGateway(System.getenv("BANK_URL"));
  Checkout checkout = new Checkout(gateway);
  // ...
}
```

## Test menjadi sederhana

```java
@Test
void chargesDiscountedAmount() {
  var gateway = new FakeGateway();
  var checkout = new Checkout(gateway);

  checkout.pay(100_000);

  assertEquals(100_000, gateway.lastAmount);
}
```

Tidak ada jaringan, tidak ada mock framework, dan test berjalan dalam milidetik.

## DI bukan DIP

| | Dependency Injection (DI) | Dependency Inversion (DIP) |
| --- | --- | --- |
| Jenis | Mekanisme / teknik | Prinsip desain |
| Menjawab | Siapa yang membuat dan memberikan dependency? | Ke arah mana dependency menunjuk? |
| Contoh tanpa yang lain | Menyuntikkan `BankGateway` konkret lewat constructor | Bisa diterapkan tanpa framework DI |

Spring memudahkan DI, tetapi keputusan bahwa `Checkout` bergantung pada `PaymentGateway` (bukan `BankGateway`) tetap keputusan desainmu.

> [!TIP] Kenapa constructor injection?
> Dependency terlihat jelas di signature, field bisa `final`, object tidak pernah setengah jadi, dan class bisa dibuat di test tanpa Spring. Ini juga cara yang direkomendasikan dokumentasi Spring untuk dependency wajib.

> [!WARNING] Abstraksi milik siapa?
> Nama dan bentuk interface sebaiknya mengikuti kebutuhan bisnis (`PaymentGateway.charge`), bukan meniru API vendor (`BcaClient.postTransferV2`). Jika interface hanya cermin dari detail, ketergantungan sebenarnya belum terbalik.
