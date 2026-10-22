import type { ModuleInput } from '../types.ts';

const r = String.raw;

const springBoot: ModuleInput = {
  slug: 'spring-boot',
  title: 'Spring Boot essentials',
  subtitle: 'Buat project dan pahami cara Spring mengelolanya.',
  description:
    'Buat project dengan Spring Initializr, jalankan lewat Maven Wrapper, lalu pelajari cara Spring membuat bean dan menghubungkan dependency. Setelah itu, susun controller, service, dan repository serta atur konfigurasi per environment.',
  category: 'Spring Boot',
  hours: '5–7',
  tint: 'mint',
  icon: 'leaf',
  lessons: [
    {
      slug: 'jdk-maven-project',
      title: 'JDK, Maven & project pertama',
      summary: 'Siapkan Java 21, buat project dari Spring Initializr, dan jalankan dengan Maven Wrapper agar build konsisten di semua mesin.',
      minutes: 40,
      objectives: [
        'Membuat project Spring Boot dengan Spring Initializr.',
        'Memahami struktur project Maven dan fungsi `pom.xml`.',
        'Menjalankan test dan aplikasi dengan `./mvnw`.',
      ],
      keyPoints: [
        'Spring Boot 3.x membutuhkan minimal Java 17; learning path ini memakai Java 21 (LTS).',
        'Maven Wrapper (`mvnw`) mengunduh versi Maven yang dikunci project, sehingga build sama di semua mesin.',
        'Starter seperti `spring-boot-starter-web` mengumpulkan dependency yang biasa dipakai bersama.',
        '`@SpringBootApplication` mengaktifkan konfigurasi otomatis dan component scanning dari package class tersebut.',
      ],
      practice: {
        task: 'Generate project dengan dependency Spring Web, Validation, dan Actuator. Jalankan `./mvnw test` dan `./mvnw spring-boot:run`.',
        proof: 'README mencatat versi JDK, versi Spring Boot, dan perintah build; `/actuator/health` menjawab `UP`.',
      },
      refs: [
        { source: 'req', note: 'Versi Java dan Maven yang didukung.' },
        { source: 'maven', note: 'Konsep dasar Maven, POM, dan lifecycle.' },
      ],
      exercises: [
        {
          kind: 'choice',
          id: 'why-wrapper',
          prompt: 'Apa keuntungan utama memakai `./mvnw` dibanding `mvn` yang terpasang global?',
          options: [
            { text: 'Semua orang dan CI memakai versi Maven yang sama seperti yang dikunci project.', correct: true },
            { text: 'Build otomatis lebih cepat dua kali lipat.', why: 'Wrapper tidak mempercepat build.' },
            { text: 'Tidak perlu JDK lagi.', why: 'Maven Wrapper tetap butuh JDK.' },
            { text: 'Dependency tidak perlu diunduh.', why: 'Dependency tetap diunduh ke repository lokal.' },
          ],
          explanation: 'Maven Wrapper menyimpan versi Maven di `.mvn/wrapper/maven-wrapper.properties`. Ini menghindari "di mesin saya bisa".',
        },
        {
          kind: 'order',
          id: 'maven-lifecycle',
          prompt: 'Urutkan fase lifecycle Maven berikut sesuai urutan eksekusinya.',
          items: ['`validate`', '`compile`', '`test`', '`package`', '`verify`', '`install`'],
          explanation: 'Menjalankan satu fase menjalankan semua fase sebelumnya. Jadi `./mvnw package` juga menjalankan compile dan test.',
        },
        {
          kind: 'fill',
          id: 'boot-annotation',
          prompt: 'Annotation apa yang dipasang pada class utama aplikasi Spring Boot?',
          context: `@___
public class OrderApplication {
  public static void main(String[] args) {
    SpringApplication.run(OrderApplication.class, args);
  }
}`,
          answers: ['SpringBootApplication', '@SpringBootApplication'],
          placeholder: 'NamaAnotasi',
          hint: 'Gabungan dari @Configuration, @EnableAutoConfiguration, dan @ComponentScan.',
          explanation: '`@SpringBootApplication` mengaktifkan auto-configuration dan memindai component di package class itu beserta sub-package-nya.',
        },
      ],
    },
    {
      slug: 'ioc-constructor-injection',
      title: 'IoC container & constructor injection',
      summary: 'Spring membuat dan menghubungkan object (bean). Constructor menyatakan dependency yang wajib tersedia sejak object dibentuk.',
      minutes: 40,
      objectives: [
        'Menjelaskan Inversion of Control dan peran ApplicationContext.',
        'Mendaftarkan bean dengan stereotype annotation atau `@Bean`.',
        'Menulis constructor injection tanpa `@Autowired` pada field.',
      ],
      keyPoints: [
        'IoC: framework yang membuat object dan memasang dependency-nya, bukan kode kita.',
        '`@Component`, `@Service`, `@Repository`, `@RestController` mendaftarkan class sebagai bean lewat component scanning.',
        'Class dengan satu constructor tidak butuh `@Autowired`; Spring memakainya otomatis.',
        'Bean default bersifat singleton: satu instance dipakai bersama oleh semua request, jadi jangan simpan state per request di field.',
        'Circular dependency adalah tanda desain perlu ditinjau ulang.',
      ],
      practice: {
        task: 'Buat `OrderService` dan `OrderRepository` sebagai bean, inject repository ke service lewat constructor.',
        proof: 'Aplikasi start, dan unit test `OrderService` bisa membuat service dengan `new` tanpa Spring.',
      },
      refs: [{ source: 'di', note: 'Constructor-based vs setter-based injection.' }],
      exercises: [
        {
          kind: 'code',
          id: 'service-injection',
          prompt: 'Jadikan `OrderService` bean Spring dan terima `OrderRepository` lewat constructor (bukan field injection).',
          language: 'java',
          starter: `public class OrderService {
  @Autowired
  private OrderRepository orders;

  public Order find(long id) {
    return orders.findById(id).orElseThrow();
  }
}`,
          solution: `@Service
public class OrderService {
  private final OrderRepository orders;

  public OrderService(OrderRepository orders) {
    this.orders = orders;
  }

  public Order find(long id) {
    return orders.findById(id).orElseThrow();
  }
}`,
          checks: [
            { label: 'Class diberi `@Service` (atau `@Component`)', pattern: r`@(Service|Component)\s+(public\s+)?(final\s+)?class\s+OrderService`, hint: 'Tambahkan `@Service` di atas `class OrderService`.' },
            { label: 'Field `private final OrderRepository`', pattern: r`private\s+final\s+OrderRepository\s+\w+\s*;`, hint: 'Ubah field menjadi `private final OrderRepository orders;`.' },
            { label: 'Constructor menerima `OrderRepository`', pattern: r`OrderService\s*\(\s*(final\s+)?OrderRepository\s+\w+\s*\)`, hint: 'Tambahkan constructor `public OrderService(OrderRepository orders)`.' },
            { label: 'Tidak ada field injection `@Autowired`', pattern: r`@Autowired\s+private`, absent: true, hint: 'Hapus `@Autowired` dari field.' },
          ],
          explanation: 'Constructor injection membuat dependency eksplisit, field bisa `final`, dan service mudah dibuat di unit test dengan `new OrderService(fakeRepo)`.',
        },
        {
          kind: 'choice',
          id: 'singleton-state',
          prompt: 'Bean `@Service` menyimpan `private Order currentOrder;` yang diisi tiap request. Apa risikonya?',
          options: [
            { text: 'Bean singleton dipakai bersama banyak request, sehingga data satu pengguna bisa tertimpa atau bocor ke pengguna lain.', correct: true },
            { text: 'Tidak ada risiko, Spring membuat bean baru tiap request.', why: 'Scope default adalah singleton, bukan per request.' },
            { text: 'Aplikasi gagal start.', why: 'Aplikasi tetap start; bug muncul saat ada request bersamaan.' },
            { text: 'Field otomatis dibuat thread-safe oleh Spring.', why: 'Spring tidak membuat field menjadi thread-safe.' },
          ],
          explanation: 'Simpan state per request di local variable atau parameter method. Field bean sebaiknya hanya berisi dependency yang immutable.',
        },
      ],
    },
    {
      slug: 'controller-service-repository',
      title: 'Controller, service & repository',
      summary: 'Controller menerima HTTP, service berisi alur bisnis, repository mengurus akses data. Pembagian ini menjaga setiap layer fokus.',
      minutes: 40,
      objectives: [
        'Membuat endpoint REST pertama dengan `@RestController`.',
        'Memindahkan logika bisnis dari controller ke service.',
        'Memahami batas tanggung jawab tiap layer.',
      ],
      keyPoints: [
        'Controller: terjemahkan HTTP ke panggilan service dan hasilnya kembali ke HTTP. Tidak ada aturan bisnis.',
        'Service: alur use case dan aturan bisnis; tidak tahu soal HTTP.',
        'Repository: menyimpan dan mengambil data.',
        'Ini struktur latihan yang umum, bukan aturan jumlah layer; yang penting arah dependency dan fokus tiap bagian.',
      ],
      practice: {
        task: 'Buat endpoint `GET /greetings/{name}` yang memanggil `GreetingService` untuk menyusun pesan.',
        proof: 'Controller hanya memanggil service, dan aturan pesan bisa dites tanpa menjalankan server.',
      },
      refs: [
        { source: 'rest', note: 'Panduan resmi membuat REST service.' },
        { source: 'di', note: 'Cara bean saling terhubung.' },
      ],
      exercises: [
        {
          kind: 'code',
          id: 'first-controller',
          prompt: 'Lengkapi controller agar `GET /greetings/{name}` mengembalikan hasil `service.greet(name)`.',
          language: 'java',
          starter: `// TODO: annotation controller
public class GreetingController {
  private final GreetingService service;

  public GreetingController(GreetingService service) {
    this.service = service;
  }

  // TODO: endpoint GET /greetings/{name}
}`,
          solution: `@RestController
public class GreetingController {
  private final GreetingService service;

  public GreetingController(GreetingService service) {
    this.service = service;
  }

  @GetMapping("/greetings/{name}")
  public String greet(@PathVariable String name) {
    return service.greet(name);
  }
}`,
          checks: [
            { label: 'Class diberi `@RestController`', pattern: r`@RestController\s+(public\s+)?class\s+GreetingController`, hint: 'Tambahkan `@RestController` di atas class.' },
            { label: '`@GetMapping("/greetings/{name}")`', pattern: r`@GetMapping\s*\(\s*(value\s*=\s*|path\s*=\s*)?"/greetings/\{name\}"\s*\)`, hint: 'Pasang `@GetMapping("/greetings/{name}")` pada method.' },
            { label: 'Parameter memakai `@PathVariable`', pattern: r`@PathVariable(\s*\(\s*"name"\s*\))?\s+String\s+name`, hint: 'Gunakan `@PathVariable String name`.' },
            { label: 'Memanggil `service.greet(name)`', pattern: r`return\s+service\s*\.\s*greet\s*\(\s*name\s*\)`, hint: 'Delegasikan ke service: `return service.greet(name);`.' },
          ],
          explanation: 'Controller tipis: hanya memetakan HTTP ke service. Aturan pesan bisa diuji di `GreetingService` tanpa server.',
        },
        {
          kind: 'choice',
          id: 'where-logic',
          prompt: 'Aturan "order di atas Rp10 juta butuh persetujuan manajer" paling tepat ditempatkan di mana?',
          options: [
            { text: 'Di service atau domain object (`Order`), karena itu aturan bisnis.', correct: true },
            { text: 'Di controller, karena controller menerima request.', why: 'Controller seharusnya tidak berisi aturan bisnis; aturan itu juga berlaku untuk jalur non-HTTP.' },
            { text: 'Di repository, saat menyimpan order.', why: 'Repository mengurus penyimpanan, bukan keputusan bisnis.' },
            { text: 'Di frontend saja.', why: 'Validasi di klien bisa dilewati; aturan bisnis harus ditegakkan di server.' },
          ],
          explanation: 'Aturan bisnis berada di service/domain sehingga berlaku konsisten untuk HTTP, message consumer, maupun job terjadwal.',
        },
      ],
    },
    {
      slug: 'configuration-profiles',
      title: 'Configuration & profiles',
      summary: 'Satu JAR, banyak lingkungan: konfigurasi berasal dari file, environment variable, atau argumen, dengan urutan prioritas yang jelas.',
      minutes: 35,
      objectives: [
        'Membaca properti dengan `@ConfigurationProperties`.',
        'Memahami urutan prioritas property source.',
        'Memakai profile untuk perbedaan antarlingkungan tanpa menyimpan secret di repo.',
      ],
      keyPoints: [
        'Environment variable dan argumen command line mengalahkan nilai di `application.yml`.',
        '`SERVER_PORT=9090` otomatis dipetakan ke `server.port` lewat *relaxed binding*.',
        '`@ConfigurationProperties` memberi konfigurasi bertipe dan tervalidasi, lebih baik daripada banyak `@Value`.',
        'Profile (`application-dev.yml`) aktif dengan `spring.profiles.active`.',
        'Password dan token tidak boleh di-commit; inject lewat environment atau secret store.',
      ],
      practice: {
        task: 'Jalankan JAR yang sama dua kali dengan port berbeda: sekali lewat environment variable, sekali lewat argumen.',
        proof: 'Kedua instance berjalan berdampingan tanpa build ulang.',
      },
      refs: [{ source: 'config', note: 'Urutan PropertySource dan relaxed binding.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'property-precedence',
          prompt: '`application.yml` berisi `server.port: 8080`, environment variable `SERVER_PORT=9090`, dan aplikasi dijalankan dengan `--server.port=7070`. Port mana yang dipakai?',
          options: [
            { text: '7070', correct: true },
            { text: '9090', why: 'Environment variable mengalahkan file, tetapi argumen command line lebih tinggi lagi.' },
            { text: '8080', why: 'Nilai di file justru prioritas paling rendah di antara ketiganya.' },
            { text: 'Aplikasi gagal karena konflik.', why: 'Spring tidak menganggapnya konflik; ia memakai sumber dengan prioritas tertinggi.' },
          ],
          explanation: 'Urutan prioritas (tinggi ke rendah, disederhanakan): argumen command line → environment variable → file konfigurasi di luar JAR → `application.yml` di dalam JAR.',
        },
        {
          kind: 'fill',
          id: 'env-name',
          prompt: 'Tulis nama environment variable untuk mengisi properti `spring.datasource.url`.',
          answers: ['SPRING_DATASOURCE_URL'],
          placeholder: 'NAMA_VARIABEL',
          hint: 'Huruf besar semua, titik diganti underscore.',
          explanation: 'Relaxed binding: ubah ke huruf besar dan ganti `.` dengan `_`. Jadi `spring.datasource.url` menjadi `SPRING_DATASOURCE_URL`.',
        },
        {
          kind: 'code',
          id: 'config-properties',
          prompt: 'Buat record `InventoryProperties` yang membaca properti dengan prefix `inventory` berisi `String baseUrl` dan `Duration timeout`.',
          language: 'java',
          starter: `// application.yml
// inventory:
//   base-url: http://localhost:8081
//   timeout: 2s

// TODO: record InventoryProperties
`,
          solution: `@ConfigurationProperties(prefix = "inventory")
public record InventoryProperties(String baseUrl, Duration timeout) {}`,
          checks: [
            { label: '`@ConfigurationProperties` dengan prefix `inventory`', pattern: r`@ConfigurationProperties\s*\(\s*(prefix\s*=\s*|value\s*=\s*)?"inventory"\s*\)`, hint: 'Tulis `@ConfigurationProperties(prefix = "inventory")`.' },
            { label: 'Record `InventoryProperties`', pattern: r`record\s+InventoryProperties\s*\(`, hint: 'Deklarasikan `public record InventoryProperties(...) {}`.' },
            { label: 'Komponen `String baseUrl`', pattern: r`String\s+baseUrl`, hint: 'Properti `base-url` dipetakan ke `baseUrl` (kebab-case ke camelCase).' },
            { label: 'Komponen `Duration timeout`', pattern: r`Duration\s+timeout`, hint: 'Pakai `java.time.Duration` agar nilai seperti `2s` dikonversi otomatis.' },
          ],
          explanation: 'Daftarkan record ini dengan `@EnableConfigurationProperties(InventoryProperties.class)` atau `@ConfigurationPropertiesScan`. Hasilnya konfigurasi bertipe yang bisa di-inject seperti bean biasa.',
        },
      ],
    },
  ],
};

export default springBoot;
