## Liskov Substitution Principle

LSP, dirumuskan Barbara Liskov, menyatakan bahwa **object dari subtipe harus bisa menggantikan object dari tipe induknya tanpa mengubah kebenaran program**. Dengan kata lain, pemanggil yang menulis kode untuk sebuah kontrak tidak boleh dikejutkan oleh implementasi tertentu.

Implementasi melanggar LSP ketika ia:

- **Memperketat syarat input**, misalnya kontrak menerima semua quantity positif tetapi implementasi menolak quantity di atas 10.
- **Melemahkan janji output**, misalnya kontrak menjanjikan list tidak null tetapi implementasi mengembalikan `null`.
- **Melempar exception yang tidak diharapkan**, terutama `UnsupportedOperationException`.

## Contoh pelanggaran

```java
interface OrderRepository {
  Optional<Order> findById(long id);
  void save(Order order);
}

class ReportingOrderRepository implements OrderRepository {
  public Optional<Order> findById(long id) { ... }

  public void save(Order order) {
    throw new UnsupportedOperationException("read-only");  // kejutan!
  }
}
```

Kode yang menerima `OrderRepository` wajar memanggil `save`. Ketika diberi `ReportingOrderRepository`, ia gagal saat runtime. Compiler tidak bisa membantu karena kontraknya sendiri yang keliru.

> [!NOTE] Contoh klasik: persegi dan persegi panjang
> Secara matematika persegi adalah persegi panjang. Namun jika `Rectangle` punya `setWidth` dan `setHeight` independen, `Square extends Rectangle` akan melanggar ekspektasi pemanggil. Hubungan "adalah" di dunia nyata tidak selalu berarti subtipe yang aman.

## Interface Segregation Principle

ISP menyatakan bahwa **klien tidak boleh dipaksa bergantung pada method yang tidak ia pakai**. Interface gemuk memaksa setiap implementasi menyediakan semua method, termasuk yang tidak relevan, sehingga berujung pada method palsu seperti contoh di atas.

Solusinya: pecah menjadi interface kecil berdasarkan kebutuhan klien.

```java
interface OrderReader {
  Optional<Order> findById(long id);
}

interface OrderWriter {
  void save(Order order);
}

class JpaOrderRepository implements OrderReader, OrderWriter { ... }
class ReportingOrderRepository implements OrderReader { ... }   // tidak ada save palsu
```

Layanan laporan cukup meminta `OrderReader`. Layanan pembuatan order meminta keduanya.

## LSP dan ISP saling melengkapi

| Gejala | Prinsip | Perbaikan |
| --- | --- | --- |
| Implementasi melempar `UnsupportedOperationException` | LSP | Perbaiki kontrak; sering kali dengan memecah interface |
| Fake untuk test harus mengimplementasikan 15 method padahal hanya 1 yang dipakai | ISP | Interface kecil sesuai kebutuhan klien |
| Pemanggil memakai `instanceof` untuk tahu implementasi mana | LSP | Implementasi harus bisa saling menggantikan |

> [!TIP] Bonus untuk test
> Interface kecil membuat fake sangat murah. `OrderReader` cukup diimplementasikan dengan lambda: `OrderReader reader = id -> Optional.of(sampleOrder);`.
