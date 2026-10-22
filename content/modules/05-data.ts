import type { ModuleInput } from '../types.ts';

const r = String.raw;

const data: ModuleInput = {
  slug: 'data-transaksi',
  title: 'Data & transaksi',
  subtitle: 'Simpan data dan atur transaksi dengan Spring Data JPA.',
  description:
    'Petakan entity ke tabel, buat repository, dan tentukan operasi yang harus berada dalam satu transaksi. Kamu juga akan menulis database migration dan memeriksa query untuk menemukan masalah seperti N+1.',
  category: 'Spring Boot',
  hours: '7–10',
  tint: 'yellow',
  icon: 'database',
  lessons: [
    {
      slug: 'entity-repository',
      title: 'Entity, ID & repository',
      summary: 'JPA memetakan object ke tabel relasional. Spring Data membuat implementasi repository dari interface.',
      minutes: 45,
      objectives: [
        'Memetakan class menjadi entity dengan `@Entity` dan `@Id`.',
        'Membuat repository dengan `JpaRepository` dan query method.',
        'Menghubungkan aplikasi ke PostgreSQL lewat konfigurasi datasource.',
      ],
      keyPoints: [
        '`@Entity` menandai class yang dipetakan ke tabel; `@Id` menandai primary key.',
        '`JpaRepository<Order, Long>` menyediakan `save`, `findById`, `findAll`, `deleteById`, dan lain-lain.',
        'Query method seperti `findByStatus` diturunkan dari nama method.',
        'JPA butuh constructor tanpa argumen (boleh `protected`).',
        'Pahami SQL yang dihasilkan; abstraksi tidak menghapus biaya database.',
      ],
      practice: {
        task: 'Simpan `Order` ke PostgreSQL lewat repository dan baca kembali berdasarkan ID.',
        proof: 'Data tetap ada setelah aplikasi di-restart.',
      },
      refs: [{ source: 'jpa', note: 'Panduan entity dan repository Spring Data JPA.' }],
      exercises: [
        {
          kind: 'code',
          id: 'map-entity',
          prompt: 'Jadikan `Order` sebuah entity JPA dengan `id` sebagai primary key yang dibangkitkan database (IDENTITY), dan tambahkan constructor tanpa argumen `protected`.',
          language: 'java',
          starter: `public class Order {
  private Long id;
  private String product;
  private int quantity;

  public Order(String product, int quantity) {
    this.product = product;
    this.quantity = quantity;
  }
}`,
          solution: `@Entity
@Table(name = "orders")
public class Order {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String product;
  private int quantity;

  protected Order() {}

  public Order(String product, int quantity) {
    this.product = product;
    this.quantity = quantity;
  }
}`,
          checks: [
            { label: 'Class diberi `@Entity`', pattern: r`@Entity[\s\S]*class\s+Order`, hint: 'Tambahkan `@Entity` di atas class.' },
            { label: '`@Id` pada field `id`', pattern: r`@Id\s+(@GeneratedValue[^\n]*\s+)?private\s+Long\s+id`, hint: 'Beri `@Id` pada `private Long id;`.' },
            { label: '`@GeneratedValue(strategy = GenerationType.IDENTITY)`', pattern: r`@GeneratedValue\s*\(\s*strategy\s*=\s*GenerationType\s*\.\s*IDENTITY\s*\)`, hint: 'Tulis `@GeneratedValue(strategy = GenerationType.IDENTITY)`.' },
            { label: 'Constructor tanpa argumen `protected`', pattern: r`protected\s+Order\s*\(\s*\)`, hint: 'Tambahkan `protected Order() {}` untuk JPA.' },
          ],
          explanation: '`@Table(name = "orders")` juga disarankan karena `order` adalah SQL keyword. Constructor `protected` memenuhi kebutuhan JPA tanpa membuka pembuatan object kosong untuk kode lain.',
        },
        {
          kind: 'fill',
          id: 'query-method',
          prompt: 'Lengkapi nama query method agar Spring Data membuat query `WHERE status = ?`.',
          context: `interface OrderRepository extends JpaRepository<Order, Long> {
  List<Order> ___(OrderStatus status);
}`,
          answers: ['findByStatus', 'findAllByStatus', 'readByStatus', 'getByStatus', 'queryByStatus'],
          placeholder: 'namaMethod',
          hint: 'Awali dengan `findBy` lalu nama property.',
          explanation: 'Spring Data mengurai nama method: `findBy` + `Status` menjadi kondisi pada property `status`. Kombinasi seperti `findByStatusAndCustomerId` juga didukung.',
        },
        {
          kind: 'choice',
          id: 'entity-as-dto',
          prompt: 'Mengapa sebaiknya entity tidak dikembalikan langsung sebagai response API?',
          multiple: true,
          options: [
            { text: 'Field internal bisa bocor dan perubahan schema mengubah kontrak publik.', correct: true },
            { text: 'Serialisasi JSON bisa memicu lazy loading relasi dan query tak terduga.', correct: true },
            { text: 'Entity tidak bisa diubah menjadi JSON sama sekali.', why: 'Bisa, dan justru itu sumber masalahnya.' },
            { text: 'Spring melarangnya dan aplikasi gagal start.', why: 'Tidak dilarang; ini keputusan desain.' },
          ],
          explanation: 'Petakan entity ke DTO response secara eksplisit. Kontrak publik tetap stabil walau schema database berubah.',
        },
      ],
    },
    {
      slug: 'local-transactions',
      title: 'Batas transaksi lokal',
      summary: '`@Transactional` menyatukan beberapa operasi database menjadi satu unit kerja: semua berhasil atau semua dibatalkan.',
      minutes: 40,
      objectives: [
        'Menempatkan `@Transactional` pada method service per use case.',
        'Memahami aturan rollback default.',
        'Mengenali jebakan self-invocation pada proxy.',
      ],
      keyPoints: [
        'Transaksi memberi atomicity: tidak ada perubahan setengah jadi yang tersimpan.',
        'Secara default Spring melakukan rollback untuk `RuntimeException` dan `Error`, bukan checked exception.',
        '`@Transactional` bekerja lewat proxy; memanggil method transactional dari method lain di class yang sama tidak melewati proxy.',
        'Di dalam transaksi, perubahan pada entity yang dikelola otomatis di-flush (dirty checking).',
        'Transaksi ini lokal pada satu datasource, tidak mencakup service lain.',
      ],
      practice: {
        task: 'Buat use case yang menyimpan order lalu sengaja melempar exception pada operasi kedua.',
        proof: 'Database tidak berisi order dari percobaan yang gagal.',
      },
      refs: [{ source: 'tx', note: 'Transaksi pada repository dan service.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'rollback-default',
          prompt: 'Method `@Transactional` melempar `IOException` (checked). Apa yang terjadi secara default?',
          options: [
            { text: 'Transaksi di-commit, karena default rollback hanya untuk unchecked exception.', correct: true },
            { text: 'Transaksi di-rollback.', why: 'Untuk checked exception, perlu `rollbackFor = IOException.class`.' },
            { text: 'Aplikasi crash.', why: 'Exception diteruskan ke pemanggil; transaksinya di-commit.' },
            { text: 'Spring mengulang transaksi otomatis.', why: 'Spring tidak melakukan retry transaksi secara default.' },
          ],
          explanation: 'Secara default, checked exception tidak memicu rollback. Gunakan unchecked exception untuk kegagalan bisnis, atau tambahkan `@Transactional(rollbackFor = Exception.class)` bila perlu.',
        },
        {
          kind: 'choice',
          id: 'self-invocation',
          prompt: '`OrderService.placeAll()` (tanpa annotation) memanggil `this.place()` yang diberi `@Transactional`. Apakah `place()` berjalan dalam transaksi?',
          options: [
            { text: 'Tidak, panggilan lewat `this` tidak melewati proxy transaksi Spring.', correct: true },
            { text: 'Ya, annotation selalu berlaku di mana pun method dipanggil.', why: 'Dengan proxy berbasis Spring AOP (default), hanya panggilan dari luar bean yang dicegat.' },
            { text: 'Ya, tetapi hanya untuk method `public`.', why: 'Visibility tidak menolong; masalahnya panggilan internal.' },
            { text: 'Kompilasi gagal.', why: 'Kode tetap terkompilasi; bug-nya muncul saat runtime.' },
          ],
          explanation: 'Solusinya: pasang `@Transactional` pada method yang dipanggil dari luar (`placeAll`), atau pindahkan `place` ke bean lain.',
        },
        {
          kind: 'code',
          id: 'transactional-confirm',
          prompt: 'Jadikan `confirm` satu transaksi: ambil order, ubah statusnya lewat `order.confirm()`, dan biarkan dirty checking menyimpan perubahan.',
          language: 'java',
          starter: `@Service
class OrderService {
  private final OrderRepository orders;

  OrderService(OrderRepository orders) {
    this.orders = orders;
  }

  public void confirm(Long id) {
    // TODO
  }
}`,
          solution: `@Service
class OrderService {
  private final OrderRepository orders;

  OrderService(OrderRepository orders) {
    this.orders = orders;
  }

  @Transactional
  public void confirm(Long id) {
    Order order = orders.findById(id)
        .orElseThrow(() -> new OrderNotFoundException(id));
    order.confirm();
  }
}`,
          checks: [
            { label: '`@Transactional` pada method `confirm`', pattern: r`@Transactional(\s*\([^)]*\))?\s+public\s+void\s+confirm`, hint: 'Tambahkan `@Transactional` tepat di atas `public void confirm`.' },
            { label: 'Mengambil order dengan `findById`', pattern: r`orders\s*\.\s*findById\s*\(\s*id\s*\)`, hint: 'Gunakan `orders.findById(id)`.' },
            { label: 'Menangani order tidak ada dengan `orElseThrow`', pattern: r`\.\s*orElseThrow\s*\(`, hint: 'Lanjutkan dengan `.orElseThrow(() -> new OrderNotFoundException(id))`.' },
            { label: 'Memanggil `order.confirm()`', pattern: r`\w+\s*\.\s*confirm\s*\(\s*\)\s*;`, hint: 'Ubah state lewat method domain `order.confirm();`.' },
          ],
          explanation: 'Tidak perlu `orders.save(order)`: entity yang dimuat dalam transaksi dikelola persistence context, dan perubahannya di-flush saat commit.',
        },
      ],
    },
    {
      slug: 'schema-migration',
      title: 'Migrasi schema',
      summary: 'Perubahan schema dicatat sebagai skrip berversi yang dijalankan berurutan, sehingga setiap database bisa dibawa ke versi yang sama.',
      minutes: 35,
      objectives: [
        'Menulis migrasi Flyway dengan konvensi penamaan `V{versi}__{deskripsi}.sql`.',
        'Memahami mengapa `ddl-auto=update` tidak cocok untuk produksi.',
        'Mendesain migrasi yang aman untuk data yang sudah ada.',
      ],
      keyPoints: [
        'Flyway mencatat migrasi yang sudah dijalankan di tabel `flyway_schema_history`.',
        'Migrasi yang sudah dijalankan tidak boleh diubah; buat migrasi baru untuk perubahan berikutnya.',
        '`spring.jpa.hibernate.ddl-auto=validate` memastikan entity cocok dengan schema tanpa mengubahnya.',
        'Perubahan besar (rename kolom, NOT NULL) sering perlu beberapa langkah agar versi aplikasi lama dan baru bisa berjalan berdampingan.',
      ],
      practice: {
        task: 'Buat migrasi awal tabel `orders` dan migrasi kedua yang menambah kolom `status` dengan nilai default.',
        proof: 'Database kosong maupun database versi pertama bisa dibawa ke versi terbaru tanpa error.',
      },
      refs: [{ source: 'migration', note: 'Inisialisasi database, Flyway, dan Liquibase di Spring Boot.' }],
      exercises: [
        {
          kind: 'fill',
          id: 'flyway-name',
          prompt: 'Tulis nama file Flyway untuk migrasi versi 2 yang menambah kolom status (deskripsi: `add_order_status`).',
          answers: ['V2__add_order_status.sql'],
          placeholder: 'V?__....sql',
          hint: 'Awalan V, nomor versi, dua garis bawah, deskripsi, lalu .sql.',
          explanation: 'Konvensi Flyway: `V<versi>__<deskripsi>.sql` di `src/main/resources/db/migration`. Perhatikan dua underscore.',
        },
        {
          kind: 'order',
          id: 'safe-not-null',
          prompt: 'Urutkan langkah aman menambah kolom `status` yang wajib (NOT NULL) ke tabel yang sudah berisi data.',
          items: [
            'Tambah kolom `status` yang boleh NULL.',
            'Isi kolom untuk baris lama (`UPDATE orders SET status = \'NEW\'`).',
            'Rilis aplikasi yang selalu mengisi `status` untuk data baru.',
            'Tambahkan constraint NOT NULL dan default di migrasi berikutnya.',
          ],
          explanation: 'Langsung `ADD COLUMN ... NOT NULL` tanpa default gagal pada tabel berisi data, dan bisa mengunci tabel lama. Langkah bertahap menjaga kompatibilitas selama rollout.',
        },
        {
          kind: 'choice',
          id: 'ddl-auto',
          prompt: 'Nilai `spring.jpa.hibernate.ddl-auto` yang tepat ketika schema dikelola Flyway adalah…',
          options: [
            { text: '`validate` (atau `none`)', correct: true },
            { text: '`update`', why: 'Hibernate akan mengubah schema diam-diam tanpa riwayat dan tidak pernah menghapus kolom.' },
            { text: '`create-drop`', why: 'Menghapus seluruh schema saat aplikasi berhenti. Hanya untuk eksperimen.' },
            { text: '`create`', why: 'Membuat ulang schema dan menghapus data setiap start.' },
          ],
          explanation: 'Kelola semua perubahan schema melalui Flyway. `validate` membuat aplikasi gagal start jika mapping entity tidak cocok dengan tabel.',
        },
      ],
    },
    {
      slug: 'relations-query-cost',
      title: 'Relasi & query performance',
      summary: 'Relasi object bisa memicu query tambahan tanpa terlihat. Periksa SQL yang dihasilkan dan pilih strategi fetch sesuai data yang dibutuhkan.',
      minutes: 40,
      objectives: [
        'Memetakan relasi `@OneToMany` / `@ManyToOne`.',
        'Mengenali dan memperbaiki masalah N+1 query.',
        'Memakai fetch join, `@EntityGraph`, atau projection.',
      ],
      keyPoints: [
        'Masalah N+1: 1 query untuk daftar, lalu N query tambahan untuk relasi setiap elemen.',
        'Relasi `@OneToMany` default-nya LAZY; `@ManyToOne` default-nya EAGER, dan sebaiknya diubah ke LAZY.',
        '`JOIN FETCH` atau `@EntityGraph` memuat relasi dalam satu query untuk use case tertentu.',
        'Aktifkan log SQL saat development untuk melihat jumlah query yang sebenarnya.',
      ],
      practice: {
        task: 'Ambil 20 order beserta item-nya dan catat jumlah query yang terjadi sebelum dan sesudah perbaikan.',
        proof: 'Catatan menjelaskan query tambahan, penyebabnya, dan perbaikan yang dipilih.',
      },
      refs: [{ source: 'jpa', note: 'Repository dan query di Spring Data JPA.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'n-plus-one',
          prompt: 'Kode memuat 20 order lalu memanggil `order.getItems().size()` untuk masing-masing. Log menunjukkan 21 query. Ini disebut…',
          options: [
            { text: 'Masalah N+1 query', correct: true },
            { text: 'Deadlock', why: 'Deadlock adalah dua transaksi saling menunggu lock.' },
            { text: 'Cartesian product', why: 'Itu terjadi saat join beberapa koleksi sekaligus, menghasilkan baris berlipat.' },
            { text: 'Dirty read', why: 'Dirty read terkait isolasi transaksi, bukan jumlah query.' },
          ],
          explanation: '1 query untuk daftar order + 20 query lazy loading item = 21. Jumlah query bertambah seiring jumlah order dan bisa memperlambat response.',
        },
        {
          kind: 'code',
          id: 'fetch-join',
          prompt: 'Tulis query method dengan `@Query` yang memuat order beserta item-nya dalam satu query memakai `JOIN FETCH`.',
          language: 'java',
          starter: `interface OrderRepository extends JpaRepository<Order, Long> {
  // TODO: findAllWithItems
}`,
          solution: `interface OrderRepository extends JpaRepository<Order, Long> {
  @Query("select distinct o from Order o join fetch o.items")
  List<Order> findAllWithItems();
}`,
          checks: [
            { label: 'Memakai annotation `@Query`', pattern: r`@Query\s*\(`, hint: 'Tambahkan `@Query("...")` di atas method.' },
            { label: 'JPQL memakai `join fetch o.items`', pattern: r`join\s+fetch\s+\w+\s*\.\s*items`, flags: 'im', hint: 'Contoh: `select distinct o from Order o join fetch o.items`.' },
            { label: 'Method `List<Order> findAllWithItems()`', pattern: r`List\s*<\s*Order\s*>\s+findAllWithItems\s*\(\s*\)`, hint: 'Deklarasikan `List<Order> findAllWithItems();`.' },
          ],
          explanation: '`JOIN FETCH` memuat item bersama order dalam satu query. Alternatifnya `@EntityGraph(attributePaths = "items")` pada query method biasa.',
        },
      ],
    },
  ],
};

export default data;
