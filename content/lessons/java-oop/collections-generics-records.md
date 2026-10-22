## Tiga collection yang paling sering dipakai

Java Collections Framework menyediakan interface standar beserta beberapa implementasinya.

| Interface | Karakter | Implementasi umum |
| --- | --- | --- |
| `List<E>` | Berurutan, boleh duplikat, akses lewat indeks | `ArrayList` |
| `Set<E>` | Elemen unik, tanpa indeks | `HashSet`, `LinkedHashSet`, `TreeSet` |
| `Map<K, V>` | Pasangan key → value, key unik | `HashMap`, `LinkedHashMap`, `TreeMap` |

Pilih berdasarkan cara kamu *mengakses* data:

- Perlu urutan dan iterasi? `List`.
- Perlu memastikan tidak ada duplikat, misalnya kumpulan SKU? `Set`.
- Perlu mencari berdasarkan kunci, misalnya order berdasarkan ID? `Map`.

## Deklarasikan dengan interface

```java
Map<Long, Order> orders = new HashMap<>();
List<OrderLine> lines = new ArrayList<>();
```

Sisi kiri memakai interface, sisi kanan memilih implementasi. Jika nanti kamu butuh urutan penyisipan, cukup ganti ke `LinkedHashMap` tanpa mengubah kode yang memakai `orders`.

## Generics: tipe diperiksa saat kompilasi

Generics (`<Long, Order>`) memberi tahu compiler tipe elemen di dalam collection. Kesalahan seperti memasukkan `String` ke `Map<Long, Order>` ditolak saat kompilasi, bukan meledak saat runtime.

```java
orders.put(1L, new Order(new BigDecimal("50000")));
Order first = orders.get(1L);   // tidak perlu cast
// orders.put("1", ...);        // error kompilasi: String bukan Long
```

Operator *diamond* `<>` di sisi kanan membiarkan compiler menyimpulkan tipe dari sisi kiri.

## Optional untuk nilai yang mungkin tidak ada

`Map.get` mengembalikan `null` jika key tidak ada. `null` mudah terlupa dan berujung `NullPointerException`. `Optional` membuat kemungkinan "tidak ada" menjadi bagian dari tipe:

```java
Optional<Order> findById(long id) {
  return Optional.ofNullable(orders.get(id));
}

findById(42)
    .map(Order::total)
    .ifPresentOrElse(
        total -> System.out.println("Total: " + total),
        () -> System.out.println("Order 42 tidak ditemukan"));
```

> [!TIP] Kapan memakai Optional
> Pakai `Optional` sebagai **tipe kembalian** method pencarian. Hindari sebagai tipe field atau parameter; untuk itu cukup pastikan nilai tidak null sejak awal.

## Record: data immutable yang ringkas

`record` (Java 16+) adalah class khusus untuk membawa data. Compiler membuat constructor, accessor, `equals`, `hashCode`, dan `toString` secara otomatis. Semua komponennya `final`.

```java
public record OrderLine(String product, int quantity) {
  public OrderLine {                 // compact constructor
    if (quantity < 1) {
      throw new IllegalArgumentException("quantity minimal 1");
    }
  }
}

var line = new OrderLine("Keyboard", 2);
line.product();   // "Keyboard" (accessor tanpa awalan get)
```

Record sangat cocok untuk DTO request/response di REST API, yang akan kamu pakai di modul 4.

## Iterasi dan Stream

Selain `for`, kamu bisa mengolah collection dengan Stream API:

```java
long totalQuantity = lines.stream()
    .mapToInt(OrderLine::quantity)
    .sum();

List<String> products = lines.stream()
    .map(OrderLine::product)
    .distinct()
    .toList();
```

> [!WARNING] HashMap dan banyak thread
> `HashMap` dan `ArrayList` tidak dirancang untuk ditulis dari banyak thread sekaligus. Di aplikasi web, satu bean dipakai oleh banyak request secara bersamaan. Gunakan `ConcurrentHashMap`, atau lebih baik, simpan state di database.
