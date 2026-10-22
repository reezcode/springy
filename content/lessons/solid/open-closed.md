## Terbuka untuk ekstensi, tertutup untuk modifikasi

Open/Closed Principle menyatakan bahwa modul sebaiknya **bisa diperluas perilakunya tanpa mengubah kode sumbernya**. Kode yang sudah stabil dan teruji tidak perlu disentuh ketika ada variasi baru.

## Bau kode: rantai if per jenis

```java title="Melanggar OCP"
public long finalPrice(long subtotal, String customerType) {
  if (customerType.equals("REGULAR")) {
    return subtotal;
  } else if (customerType.equals("MEMBER")) {
    return subtotal * 90 / 100;
  } else if (customerType.equals("PROMO")) {
    return subtotal * 80 / 100;
  }
  throw new IllegalArgumentException("Tipe tidak dikenal");
}
```

Setiap jenis diskon baru memaksa kamu membuka method ini, menambah cabang, dan berisiko merusak cabang lain. Jika logika serupa tersebar di beberapa tempat, kamu harus ingat mengubah semuanya.

## Titik ekstensi dengan interface

```java
public interface DiscountPolicy {
  long apply(long subtotal);
}

public class NoDiscount implements DiscountPolicy {
  public long apply(long subtotal) { return subtotal; }
}

public class MemberDiscount implements DiscountPolicy {
  public long apply(long subtotal) { return subtotal * 90 / 100; }
}
```

```java title="Checkout tidak perlu tahu jenis diskon"
public final class Checkout {
  private final DiscountPolicy policy;

  public Checkout(DiscountPolicy policy) {
    this.policy = policy;
  }

  public long total(long subtotal) {
    return policy.apply(subtotal);
  }
}
```

Diskon promo baru? Tambahkan class `PromoDiscount`. `Checkout` tetap tertutup dari modifikasi, tetapi terbuka untuk ekstensi. Pola ini disebut **Strategy**.

> [!TIP] Coba di playground
> Lab "SOLID & strategy" memperlihatkan alur Checkout yang tetap sama ketika discount policy dan payment gateway diganti.

## Memilih strategi saat runtime

Pemilihan implementasi tetap harus terjadi di suatu tempat, tetapi cukup di **satu** tempat, biasanya saat object dirakit:

```java
DiscountPolicy policy = switch (customer.tier()) {
  case REGULAR -> new NoDiscount();
  case MEMBER -> new MemberDiscount();
  case PROMO -> new PromoDiscount();
};
new Checkout(policy).total(subtotal);
```

Di Spring, kamu bisa menyuntikkan `Map<String, DiscountPolicy>` berisi semua bean implementasi dan memilih berdasarkan key.

## Hindari abstraksi spekulatif

OCP bukan alasan untuk membuat interface bagi setiap class "kalau-kalau nanti dibutuhkan". Abstraksi punya biaya: lebih banyak file, alur lebih sulit diikuti, dan kontrak yang salah tebak.

> [!WARNING] Aturan praktis
> Tulis kode langsung saat hanya ada satu variasi. Ketika variasi kedua benar-benar muncul, refactor ke interface. Pada titik itu kamu sudah tahu bentuk kontrak yang tepat.
