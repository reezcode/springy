## Interface sebagai kontrak

**Interface** mendeklarasikan *apa* yang bisa dilakukan, tanpa menentukan *bagaimana*. Class yang mengimplementasikannya berjanji menyediakan semua method dalam kontrak tersebut.

```java
public interface PaymentGateway {
  void charge(long amount);
}

public class BankGateway implements PaymentGateway {
  @Override
  public void charge(long amount) {
    // panggil API bank sungguhan
  }
}

public class FakeGateway implements PaymentGateway {
  long lastAmount;

  @Override
  public void charge(long amount) {
    lastAmount = amount;  // hanya merekam, untuk test
  }
}
```

Annotation `@Override` meminta compiler memastikan method benar-benar mengimplementasikan kontrak. Jika nama atau parameternya tidak sesuai, compiler akan memberi error.

## Polymorphism

Polymorphism berarti satu kode pemanggil bisa bekerja dengan banyak bentuk implementasi. Variabel bertipe interface dapat menampung object dari class mana pun yang mengimplementasikannya:

```java
PaymentGateway gateway = useFake ? new FakeGateway() : new BankGateway();
gateway.charge(150_000);  // method milik object sebenarnya yang dijalankan
```

JVM memilih method berdasarkan **tipe object saat runtime** (dynamic dispatch), bukan tipe variabelnya. Pemanggil tidak perlu `if` untuk setiap jenis gateway.

## Composition: "punya", bukan "adalah"

Ada dua cara memakai ulang perilaku class lain:

- **Inheritance** (`extends`): class baru *adalah* jenis dari class lama dan mewarisi semua perilakunya.
- **Composition**: class baru *punya* object lain sebagai field dan mendelegasikan pekerjaan kepadanya.

```java title="Checkout.java"
public final class Checkout {
  private final PaymentGateway gateway;

  public Checkout(PaymentGateway gateway) {  // dependency diberikan dari luar
    this.gateway = gateway;
  }

  public void pay(long amount) {
    gateway.charge(amount);
  }
}
```

`Checkout` tidak tahu apakah ia memakai bank sungguhan atau fake. Di aplikasi kita memberikan `BankGateway`; di unit test kita memberikan `FakeGateway` lalu memeriksa `lastAmount`.

> [!NOTE] Dependency injection lewat constructor
> Memberikan dependency lewat constructor adalah inti dari dependency injection. Di modul Spring Boot, container Spring yang akan membuat dan memasangkan object-object ini untukmu.

## Kapan inheritance masuk akal?

Inheritance cocok ketika subclass benar-benar bisa dipakai di mana pun superclass dipakai tanpa mengejutkan pemanggil. Ia menjadi masalah ketika dipakai hanya untuk menghindari menulis ulang kode:

```java title="Hindari: Checkout bukan sejenis gateway"
public class Checkout extends BankGateway { ... }
```

Desain di atas mengunci `Checkout` ke satu implementasi, membuat test sulit, dan mewariskan method yang tidak relevan. Prinsip yang sering dikutip: *favour composition over inheritance*.

| | Inheritance | Composition |
| --- | --- | --- |
| Hubungan | "adalah" | "punya" |
| Mengganti perilaku saat runtime | Sulit | Mudah, ganti object-nya |
| Coupling | Ketat ke superclass | Longgar, lewat interface |
| Test | Sering butuh subclass khusus | Cukup berikan fake |

## Default method

Sejak Java 8, interface boleh punya method `default` dengan implementasi. Gunakan secukupnya, misalnya untuk menambah method baru ke interface tanpa memaksa semua implementasi lama berubah. Jangan jadikan interface tempat logika bisnis utama.
