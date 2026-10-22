## Inversion of Control

Di modul SOLID kamu merakit object sendiri di `main`. Pada aplikasi besar, mengatur semua dependency secara manual bisa merepotkan. **Inversion of Control (IoC)** memindahkan tanggung jawab membuat dan menghubungkan object ke framework. Di Spring, tugas itu dipegang **ApplicationContext**, dan object yang dikelolanya disebut **bean**.

```text
Tanpa IoC:  kode kita  ──new──►  object-object
Dengan IoC: Spring     ──new──►  bean  ──inject──►  bean lain
```

## Mendaftarkan bean

Cara paling umum adalah **stereotype annotation** yang ditemukan oleh component scan:

| Annotation | Dipakai untuk |
| --- | --- |
| `@Component` | Komponen umum |
| `@Service` | Logika bisnis / use case |
| `@Repository` | Akses data; exception persistence diterjemahkan Spring |
| `@RestController` | Endpoint HTTP yang mengembalikan body (JSON) |

Untuk class dari library yang tidak bisa kamu beri annotation, gunakan method `@Bean` di class `@Configuration`:

```java
@Configuration
class ClockConfig {
  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }
}
```

## Constructor injection

```java
@Service
public class OrderService {
  private final OrderRepository orders;
  private final Clock clock;

  public OrderService(OrderRepository orders, Clock clock) {
    this.orders = orders;
    this.clock = clock;
  }
}
```

Saat membuat `OrderService`, Spring melihat constructor-nya, mencari bean bertipe `OrderRepository` dan `Clock`, lalu memberikannya. Jika class hanya punya **satu constructor**, annotation `@Autowired` tidak diperlukan.

> [!TIP] Kenapa bukan field injection?
> `@Autowired private OrderRepository orders;` memang singkat, tetapi field tidak bisa `final`, dependency tersembunyi, dan class tidak bisa dibuat di unit test tanpa refleksi atau Spring. Constructor injection menghindari ketiganya.

## Bean scope dan state

Secara default bean memiliki scope **singleton**: satu instance per ApplicationContext, dipakai bersama oleh semua thread. Server web menangani banyak request sekaligus dengan banyak thread, sehingga semua thread itu memakai object service yang sama.

```java title="Berbahaya"
@Service
class CartService {
  private Cart current;            // dipakai bersama semua pengguna!

  void add(Item item) { current.add(item); }
}
```

Simpan data per request di local variable, parameter, atau database. Field bean sebaiknya hanya berisi dependency yang tidak berubah.

## Ketika ada lebih dari satu kandidat

Jika ada dua bean bertipe `PaymentGateway`, Spring tidak bisa menebak mana yang dimaksud dan aplikasi gagal start dengan pesan *expected single matching bean but found 2*. Pilihannya:

- Tandai salah satu dengan `@Primary`.
- Pilih secara eksplisit dengan `@Qualifier("bankGateway")` pada parameter constructor.
- Minta semuanya: `List<PaymentGateway>` atau `Map<String, PaymentGateway>`.

> [!WARNING] Circular dependency
> Jika A butuh B dan B butuh A lewat constructor, Spring Boot menolak start. Itu sinyal desain: biasanya ada tanggung jawab yang perlu dipindah ke class ketiga, bukan alasan memakai field injection untuk mengakalinya.
