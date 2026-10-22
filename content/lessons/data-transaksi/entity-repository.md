## Dari object ke tabel

**JPA** (Jakarta Persistence API) adalah spesifikasi untuk memetakan object Java ke tabel relasional. **Hibernate** adalah implementasi yang dipakai Spring Boot secara default. **Spring Data JPA** menambahkan repository layer di atasnya sehingga kamu jarang menulis kode akses data berulang.

Tambahkan dependency `spring-boot-starter-data-jpa` dan driver database, misalnya `org.postgresql:postgresql`.

## Memetakan entity

```java title="Order.java"
@Entity
@Table(name = "orders")          // "order" adalah SQL keyword
public class Order {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 100)
  private String product;

  private int quantity;

  @Enumerated(EnumType.STRING)
  private OrderStatus status = OrderStatus.NEW;

  protected Order() {}           // dibutuhkan JPA

  public Order(String product, int quantity) {
    this.product = product;
    this.quantity = quantity;
  }

  public void confirm() {
    if (status != OrderStatus.NEW) {
      throw new IllegalStateException("Hanya order NEW yang bisa dikonfirmasi");
    }
    status = OrderStatus.CONFIRMED;
  }

  public Long getId() { return id; }
  // getter lain...
}
```

| Annotation | Fungsi |
| --- | --- |
| `@Entity` | Class dipetakan ke tabel |
| `@Table(name)` | Nama tabel jika berbeda dari nama class |
| `@Id` | Primary key |
| `@GeneratedValue` | Nilai ID dibangkitkan database atau sequence |
| `@Column` | Detail kolom: nama, nullable, panjang |
| `@Enumerated(STRING)` | Simpan enum sebagai teks, bukan angka urutan |

> [!WARNING] Simpan enum sebagai STRING
> Default `EnumType.ORDINAL` menyimpan posisi enum (0, 1, 2). Menyisipkan nilai enum baru di tengah akan mengubah arti data lama secara diam-diam.

Perhatikan bahwa entity tetap boleh berisi perilaku (`confirm()`). Entity bukan sekadar wadah data.

## Repository

```java
public interface OrderRepository extends JpaRepository<Order, Long> {
  List<Order> findByStatus(OrderStatus status);
  Optional<Order> findFirstByProductOrderByIdDesc(String product);
  long countByStatus(OrderStatus status);
}
```

Spring Data membuat implementasinya saat start. `JpaRepository` sudah menyediakan `save`, `findById`, `findAll`, `deleteById`, paging, dan sorting. Query method diturunkan dari nama method: `findBy` + nama property + keyword seperti `And`, `OrderBy`, `Between`, `In`.

Untuk query yang lebih rumit, gunakan JPQL dengan `@Query`:

```java
@Query("select o from Order o where o.quantity > :min and o.status = :status")
List<Order> findLarge(@Param("min") int min, @Param("status") OrderStatus status);
```

## Konfigurasi koneksi

```yaml title="application.yml"
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/orders
    username: orders
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
```

Menjalankan PostgreSQL lokal dengan container:

```shell
docker run --rm -d --name orders-db -p 5432:5432 \
  -e POSTGRES_DB=orders -e POSTGRES_USER=orders -e POSTGRES_PASSWORD=secret \
  postgres:16
```

> [!TIP] Matikan open-in-view
> `spring.jpa.open-in-view` aktif secara default dan membiarkan lazy loading terjadi saat JSON diserialisasi di controller. Mematikannya memaksa kamu memuat data yang dibutuhkan secara eksplisit di service, sehingga query tidak muncul di tempat tak terduga.

## Lihat SQL yang dihasilkan

Saat development, tampilkan SQL di log agar kamu tahu apa yang sebenarnya dikirim ke database:

```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
```
