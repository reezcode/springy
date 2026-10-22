## Class dan object

**Class** adalah cetak biru: ia mendeklarasikan *state* (field) dan *perilaku* (method). **Object** adalah instans nyata dari class tersebut, dibuat dengan `new`, dan masing-masing punya nilai field sendiri.

```java title="Order.java"
public class Order {
  private final String id;      // state
  private BigDecimal total;     // state

  public Order(String id) {     // constructor
    this.id = id;
    this.total = BigDecimal.ZERO;
  }

  public void addItem(BigDecimal price) {  // perilaku
    total = total.add(price);
  }
}

Order a = new Order("A-1");  // object pertama
Order b = new Order("B-7");  // object kedua, state terpisah
```

Saat `a.addItem(...)` dipanggil, hanya total milik `a` yang berubah. Inilah alasan kita memodelkan konsep bisnis sebagai object: setiap order membawa datanya sendiri bersama aturan yang berlaku padanya.

## Constructor menjaga object lahir dalam keadaan valid

Constructor dijalankan sekali ketika object dibuat. Tempat ini ideal untuk memeriksa **invariant**, yaitu aturan yang harus selalu benar selama object hidup. Untuk order, salah satu invariant-nya adalah total tidak boleh negatif.

```java
public Order(BigDecimal total) {
  if (total.signum() < 0) {
    throw new IllegalArgumentException("Total tidak boleh negatif");
  }
  this.total = total;
}
```

Jika validasi gagal, object tidak pernah terbentuk. Kode lain tidak perlu terus-menerus bertanya "apakah total ini valid?" karena jawabannya sudah dijamin.

> [!TIP] Gunakan BigDecimal untuk uang
> `double` menyimpan angka biner sehingga `0.1 + 0.2` tidak tepat `0.3`. Untuk nilai uang, pakai `BigDecimal` yang dibuat dari `String` (`new BigDecimal("0.10")`) dan tentukan aturan pembulatan secara eksplisit.

## Encapsulation: sembunyikan state, ekspos perilaku

**Encapsulation** berarti state disembunyikan (`private`) dan hanya bisa berubah lewat method yang menjaga aturan. Bandingkan dua desain berikut:

```java title="Kurang baik: state terbuka"
order.total = order.total.subtract(new BigDecimal("999999"));  // bisa negatif!
```

```java title="Lebih baik: perubahan lewat method"
public void applyDiscount(BigDecimal amount) {
  if (amount.signum() < 0 || amount.compareTo(total) > 0) {
    throw new IllegalArgumentException("Diskon tidak valid");
  }
  total = total.subtract(amount);
}
```

Pada desain kedua, aturan diskon tinggal di satu tempat. Jika aturan berubah, kamu cukup mengubah satu method.

### Access modifier

| Modifier | Bisa diakses dari |
| --- | --- |
| `private` | Hanya class itu sendiri |
| *(tanpa modifier)* | Class lain dalam package yang sama |
| `protected` | Package yang sama dan subclass |
| `public` | Di mana saja |

Mulailah dari yang paling tertutup (`private`), lalu buka hanya bila memang dibutuhkan.

## Immutability dengan `final`

Field `final` hanya bisa di-assign sekali, biasanya di constructor. Object yang semua field-nya `final` dan tidak punya setter disebut **immutable**. Object immutable lebih mudah dipahami, aman dibagi antar-thread, dan tidak berubah diam-diam setelah diberikan ke kode lain.

Untuk perubahan, object immutable mengembalikan object baru:

```java
public Order withTotal(BigDecimal newTotal) {
  return new Order(newTotal);  // validasi constructor ikut berjalan
}
```

> [!WARNING] Getter dan setter bukan encapsulation
> Membuat field `private` lalu menambah `getX()` dan `setX()` untuk semuanya sama saja dengan field publik. Tanyakan: perilaku apa yang dibutuhkan pemanggil? Ekspos method seperti `confirm()` atau `addItem()`, bukan `setStatus()`.

## Mencoba di terminal

Java 21 bisa menjalankan satu file sumber langsung tanpa kompilasi terpisah:

```shell
java Order.java
```

Tambahkan method `main` sementara di class `Order`, buat object dengan total negatif, dan amati exception yang muncul.
