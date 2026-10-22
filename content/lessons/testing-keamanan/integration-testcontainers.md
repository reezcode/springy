## Kenapa butuh integration test?

Unit test membuktikan aturan bisnis, tetapi tidak membuktikan bahwa:

- mapping entity cocok dengan tabel,
- query JPQL/SQL valid dan mengembalikan data yang benar,
- migrasi Flyway berjalan,
- constraint database (unique, foreign key, check) bekerja seperti yang diharapkan.

Untuk itu kita perlu database sungguhan. **Testcontainers** menjalankan dependency seperti PostgreSQL, RabbitMQ, atau Kafka di container sementara selama test, lalu membersihkannya.

## Kenapa bukan H2?

H2 in-memory memang cepat, tetapi ia bukan PostgreSQL. Tipe seperti `jsonb`, fungsi tanggal, perilaku `identity`, dan pesan error berbeda. Test yang lulus di H2 bisa gagal di produksi. Prinsipnya: **uji dengan teknologi yang sama dengan produksi.**

## Setup

Dependency test (versi dikelola Spring Boot):

```xml title="pom.xml"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-testcontainers</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>junit-jupiter</artifactId>
  <scope>test</scope>
</dependency>
```

## Repository test dengan @ServiceConnection

```java title="OrderRepositoryTest.java"
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryTest {

  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

  @Autowired
  OrderRepository orders;

  @Test
  void findsOrdersByStatus() {
    orders.save(new Order("Book", 1));
    orders.save(new Order("Pen", 3));

    assertThat(orders.findByStatus(OrderStatus.NEW)).hasSize(2);
  }
}
```

- `@Testcontainers` + `@Container` mengatur start/stop container. Field `static` berarti satu container dipakai bersama semua test di class itu.
- `@ServiceConnection` (Spring Boot 3.1+) mengisi `spring.datasource.url`, username, dan password dari container. Tidak perlu `@DynamicPropertySource` lagi.
- `@DataJpaTest` hanya memuat komponen JPA dan menjalankan setiap test dalam transaksi yang di-rollback.
- `Replace.NONE` mencegah Spring mengganti datasource dengan database embedded.

Flyway ikut berjalan saat context dimuat, sehingga migrasimu juga teruji.

> [!NOTE] Field injection di test
> `@Autowired` pada field test itu wajar. Class test dibuat oleh JUnit, bukan oleh kode kita, jadi aturan constructor injection untuk class produksi tidak berlaku di sini.

## Runtime container

Testcontainers butuh Docker API. Dengan Docker Desktop atau Docker Engine biasanya langsung berjalan. Dengan **Podman**, aktifkan socket API dan arahkan `DOCKER_HOST` ke sana; di macOS/Windows jalankan `podman machine start` terlebih dahulu. Pada mode rootless, Ryuk (container pembersih) kadang perlu dinonaktifkan dengan `TESTCONTAINERS_RYUK_DISABLED=true`.

> [!WARNING] Biaya waktu
> Container butuh beberapa detik untuk start. Gunakan container `static` yang dipakai bersama, atau pola *singleton container* untuk seluruh suite, dan jangan membuat container baru per test method.

## Menjalankan aplikasi lokal dengan container yang sama

Spring Boot juga bisa memakai definisi container yang sama untuk development. Buat `TestOrderServiceApplication` di folder test yang memanggil `SpringApplication.from(OrderServiceApplication::main).with(ContainersConfig.class).run(args)`. Aplikasi lokal pun berjalan dengan PostgreSQL tanpa instalasi manual.
