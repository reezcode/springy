## Apa itu SOLID?

SOLID adalah lima prinsip desain yang dipopulerkan Robert C. Martin untuk menjaga kode tetap mudah diubah:

| Huruf | Prinsip | Pertanyaan kunci |
| --- | --- | --- |
| S | Single Responsibility | Berapa alasan class ini berubah? |
| O | Open/Closed | Bisakah variasi baru ditambah tanpa mengubah kode lama? |
| L | Liskov Substitution | Bisakah implementasi menggantikan kontraknya tanpa kejutan? |
| I | Interface Segregation | Apakah klien dipaksa bergantung pada method yang tidak dipakai? |
| D | Dependency Inversion | Apakah aturan bisnis bergantung pada detail teknis? |

Prinsip ini bukan aturan mutlak. Anggap sebagai alat untuk mengenali **bau kode** dan memutuskan di mana fleksibilitas benar-benar dibutuhkan.

## Satu alasan untuk berubah

SRP sering disalahartikan sebagai "satu class satu method". Definisi yang lebih tepat: **sebuah modul hanya bertanggung jawab kepada satu aktor**, yaitu satu kelompok pihak yang bisa meminta perubahan.

Perhatikan class berikut:

```java title="OrderManager.java (melanggar SRP)"
public class OrderManager {
  public BigDecimal calculateTotal(Order order) { ... }   // aturan harga: tim bisnis
  public void save(Order order) { ... }                    // SQL: tim data
  public void sendReceipt(Order order) { ... }             // template email: tim marketing
}
```

Tiga pihak berbeda bisa memaksa perubahan pada class yang sama. Akibatnya:

- Perubahan template email berisiko merusak kalkulasi harga karena berada di file yang sama.
- Test untuk kalkulasi harga ikut butuh database dan server email.
- Dua developer yang mengerjakan fitur berbeda sering bentrok di file yang sama.

## Memisahkan tanggung jawab

```java
public class PriceCalculator {
  public BigDecimal total(Order order) { ... }
}

public class OrderRepository {
  public void save(Order order) { ... }
}

public class ReceiptNotifier {
  public void send(Order order) { ... }
}
```

Setiap class kini kohesif: semua method di dalamnya berubah karena alasan yang sama. Alur yang menyatukan ketiganya bisa ditaruh di class layanan tingkat tinggi:

```java
public class PlaceOrder {
  private final PriceCalculator prices;
  private final OrderRepository orders;
  private final ReceiptNotifier notifier;

  // constructor menerima ketiganya

  public void handle(Order order) {
    order.setTotal(prices.total(order));
    orders.save(order);
    notifier.send(order);
  }
}
```

> [!TIP] Cara cepat menemukan pelanggaran SRP
> Coba jelaskan tugas class dalam satu kalimat tanpa kata "dan". Jika kamu butuh "menghitung total **dan** menyimpan **dan** mengirim email", class itu terlalu banyak tanggung jawab.

## Jangan berlebihan

Memecah segalanya menjadi class satu baris juga merugikan: alur jadi sulit diikuti. Pisahkan ketika kamu melihat alasan berubah yang benar-benar berbeda, atau ketika satu bagian sulit dites karena bagian lain.

> [!NOTE] SRP di Spring Boot
> Struktur `Controller` → `Service` → `Repository` di modul berikutnya adalah penerapan SRP: HTTP, aturan bisnis, dan akses data dipisah karena berubah dengan alasan berbeda.
