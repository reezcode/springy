## Memetakan relasi

Order memiliki banyak item. Di JPA, relasi dua arah biasanya dipetakan seperti ini:

```java
@Entity
@Table(name = "orders")
public class Order {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderItem> items = new ArrayList<>();

  public void addItem(OrderItem item) {
    items.add(item);
    item.setOrder(this);   // jaga kedua sisi tetap sinkron
  }
}

@Entity
public class OrderItem {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "order_id")
  private Order order;
}
```

- `mappedBy` menandai sisi yang **bukan** pemilik foreign key.
- `cascade` dan `orphanRemoval` membuat item ikut disimpan atau dihapus bersama order.
- `@ManyToOne` default-nya **EAGER**. Ubah ke `LAZY` agar tidak memuat order setiap kali item dimuat.

## Masalah N+1

```java
List<Order> orders = orderRepository.findAll();      // 1 query
for (Order order : orders) {
  System.out.println(order.getItems().size());       // 1 query per order!
}
```

Dengan 20 order, log SQL menampilkan **21 query**. Di development dengan 5 baris semuanya terasa cepat; di produksi dengan 5.000 baris, halaman menjadi lambat. Karena terjadi lewat lazy loading, masalah ini tidak terlihat di kode.

> [!TIP] Hitung query, bukan hanya waktu
> Aktifkan `logging.level.org.hibernate.SQL=DEBUG` atau statistik Hibernate (`spring.jpa.properties.hibernate.generate_statistics=true`) dan perhatikan jumlah query per request.

## Perbaikan

### 1. JOIN FETCH

```java
@Query("select distinct o from Order o join fetch o.items")
List<Order> findAllWithItems();
```

Satu query memuat order beserta item-nya. Gunakan method ini khusus untuk use case yang memang membutuhkan item.

### 2. @EntityGraph

```java
@EntityGraph(attributePaths = "items")
List<Order> findByStatus(OrderStatus status);
```

Hasilnya sama, tetapi tetap memakai query method turunan nama.

### 3. Projection / DTO query

Jika yang dibutuhkan hanya beberapa kolom, jangan muat entity utuh:

```java
public record OrderSummary(Long id, String product, long itemCount) {}

@Query("""
    select new com.example.order.OrderSummary(o.id, o.product, count(i))
    from Order o left join o.items i
    group by o.id, o.product
    """)
List<OrderSummary> summaries();
```

Projection hanya membaca kolom yang perlu dan tidak membebani persistence context.

## Jebakan lain

> [!WARNING] Jangan jadikan semua relasi EAGER
> Mengubah semua relasi menjadi EAGER untuk "menghindari lazy loading" justru memuat data yang tidak dibutuhkan di setiap query, dan tetap bisa menghasilkan N+1. Putuskan per use case dengan fetch join atau entity graph.

> [!NOTE] Paging dengan fetch join koleksi
> Menggabungkan `JOIN FETCH` koleksi dengan paging membuat Hibernate melakukan paging di memori dan mencetak peringatan. Untuk daftar berhalaman, ambil ID per halaman dulu, lalu muat relasinya dengan query kedua.
