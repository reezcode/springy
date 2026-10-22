import type { ModuleInput } from '../types.ts';

const r = String.raw;

const javaOop: ModuleInput = {
  slug: 'java-oop',
  title: 'Java & OOP',
  subtitle: 'Mulai dari objek, bukan anotasi.',
  description:
    'Fondasi sebelum framework: class, object, encapsulation, interface, composition, collections, dan exception. Spring Boot memakai semua konsep ini setiap saat, jadi waktu yang kamu habiskan di sini akan terbayar di modul berikutnya.',
  category: 'Fondasi',
  hours: '6–8',
  tint: 'peach',
  icon: 'coffee',
  lessons: [
    {
      slug: 'class-object-encapsulation',
      title: 'Class, object & encapsulation',
      summary: 'Class mendefinisikan state dan perilaku; object adalah instansinya. Encapsulation menjaga agar state hanya berubah lewat aturan yang benar.',
      minutes: 35,
      objectives: [
        'Membedakan class, object, field, constructor, dan method.',
        'Menjaga invariant dengan field `private` dan validasi di constructor.',
        'Memilih kapan memakai `final` dan objek immutable.',
      ],
      keyPoints: [
        'Class adalah cetak biru; object adalah instans yang hidup di memori dengan state sendiri.',
        'Encapsulation berarti state hanya bisa diubah melalui method yang menjaga aturan bisnis (invariant).',
        'Validasi di constructor memastikan object tidak pernah lahir dalam keadaan tidak valid.',
        'Getter dan setter untuk semua field belum tentu encapsulation; ekspos perilaku, bukan data mentah.',
      ],
      practice: {
        task: 'Buat class `Order` dengan field `private final` untuk total (`BigDecimal`) dan method `addItem` yang menolak harga negatif.',
        proof: 'Order valid terbentuk, total negatif ditolak dengan `IllegalArgumentException`, dan tidak ada setter publik untuk total.',
      },
      refs: [
        { source: 'classes', note: 'Deklarasi class, constructor, access modifier.' },
        { source: 'java', note: 'Gambaran konsep OOP di Java.' },
      ],
      exercises: [
        {
          kind: 'choice',
          id: 'class-vs-object',
          prompt: 'Manakah pernyataan yang paling tepat tentang class dan object?',
          options: [
            { text: 'Class adalah cetak biru; setiap object adalah instans dengan state miliknya sendiri.', correct: true },
            { text: 'Object adalah cetak biru; class adalah salinan object di memori.', why: 'Terbalik. `new Order(...)` membuat object dari class `Order`.' },
            { text: 'Class dan object sama saja, hanya beda penamaan.', why: 'Satu class bisa menghasilkan banyak object dengan state berbeda.' },
            { text: 'Object hanya boleh dibuat sekali untuk setiap class.', why: 'Itu pola Singleton, bukan aturan umum Java.' },
          ],
          explanation: 'Class mendeskripsikan field dan method. Setiap `new` membuat object baru dengan nilai field-nya sendiri.',
        },
        {
          kind: 'choice',
          id: 'encapsulation-why',
          prompt: 'Kenapa field `total` pada `Order` sebaiknya `private` dan hanya diubah lewat method seperti `addItem`?',
          options: [
            { text: 'Supaya aturan seperti "total tidak boleh negatif" selalu diperiksa di satu tempat.', correct: true },
            { text: 'Supaya kode berjalan lebih cepat.', why: 'Access modifier tidak dimaksudkan untuk performa.' },
            { text: 'Karena Java melarang field `public`.', why: 'Java mengizinkan field `public`, tetapi itu membuka state untuk diubah sembarangan.' },
            { text: 'Agar class bisa diwarisi.', why: 'Inheritance tidak bergantung pada field `private`.' },
          ],
          explanation: 'Encapsulation memusatkan aturan perubahan state. Kalau field publik, semua kode bisa menulis nilai tidak valid tanpa pemeriksaan.',
        },
        {
          kind: 'code',
          id: 'guarded-constructor',
          prompt: 'Lengkapi class `Order`: field `total` harus `private final`, dan constructor menolak total negatif dengan `IllegalArgumentException`.',
          language: 'java',
          starter: `import java.math.BigDecimal;

public class Order {
  // TODO: deklarasikan field total

  public Order(BigDecimal total) {
    // TODO: tolak total negatif, lalu simpan nilainya
  }

  public BigDecimal total() {
    return total;
  }
}`,
          solution: `import java.math.BigDecimal;

public class Order {
  private final BigDecimal total;

  public Order(BigDecimal total) {
    if (total.signum() < 0) {
      throw new IllegalArgumentException("Total tidak boleh negatif");
    }
    this.total = total;
  }

  public BigDecimal total() {
    return total;
  }
}`,
          checks: [
            { label: 'Field `total` dideklarasikan `private final BigDecimal`', pattern: r`private\s+final\s+BigDecimal\s+total\s*;`, hint: 'Tulis `private final BigDecimal total;` di dalam class.' },
            { label: 'Constructor memeriksa nilai negatif', pattern: r`if\s*\(\s*total\s*\.\s*(signum\s*\(\s*\)\s*<\s*0|compareTo\s*\(\s*BigDecimal\s*\.\s*ZERO\s*\)\s*<\s*0)`, hint: 'Gunakan `total.signum() < 0` atau `total.compareTo(BigDecimal.ZERO) < 0`.' },
            { label: 'Melempar `IllegalArgumentException`', pattern: r`throw\s+new\s+IllegalArgumentException\s*\(`, hint: 'Lempar `new IllegalArgumentException("...")` saat nilai tidak valid.' },
            { label: 'Nilai disimpan ke field dengan `this.total = total`', pattern: r`this\s*\.\s*total\s*=\s*total\s*;`, hint: 'Setelah validasi, simpan: `this.total = total;`.' },
            { label: 'Tidak ada setter publik untuk total', pattern: r`public\s+void\s+setTotal`, absent: true, hint: 'Hapus `setTotal`; field `final` tidak boleh diubah setelah constructor.' },
          ],
          explanation: 'Dengan validasi di constructor dan field `final`, tidak ada jalan untuk membuat `Order` dengan total negatif. Invariant dijaga sejak object lahir.',
        },
      ],
    },
    {
      slug: 'interface-polymorphism-composition',
      title: 'Interface, polymorphism & composition',
      summary: 'Interface menyatakan kontrak. Pemanggil memakai berbagai implementasi lewat tipe yang sama, dan composition menyusun perilaku dari objek lain.',
      minutes: 40,
      objectives: [
        'Menulis interface sebagai kontrak dan beberapa implementasinya.',
        'Menjelaskan polymorphism lewat pemanggilan method pada tipe interface.',
        'Memilih composition dibanding inheritance untuk memakai ulang perilaku.',
      ],
      keyPoints: [
        'Interface mendefinisikan apa yang bisa dilakukan, bukan bagaimana caranya.',
        'Polymorphism: kode yang memanggil `gateway.charge()` tidak perlu tahu implementasi mana yang dipakai.',
        'Composition ("punya") lebih fleksibel daripada inheritance ("adalah"); dependency bisa diganti saat runtime atau test.',
        'Pakai inheritance hanya bila subclass benar-benar bisa menggantikan superclass tanpa mengejutkan pemanggil.',
      ],
      practice: {
        task: 'Buat interface `PaymentGateway` dengan dua implementasi (`BankGateway`, `FakeGateway`) lalu inject ke `Checkout` melalui constructor.',
        proof: '`Checkout` bisa berganti gateway tanpa mengubah satu baris pun di dalam `Checkout`.',
      },
      refs: [{ source: 'java', note: 'Bagian interface dan inheritance.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'polymorphism',
          prompt: 'Variabel `PaymentGateway gateway = new FakeGateway();` lalu dipanggil `gateway.charge(100)`. Method mana yang dijalankan?',
          options: [
            { text: '`FakeGateway.charge`, karena method dipilih berdasarkan tipe object saat runtime.', correct: true },
            { text: '`PaymentGateway.charge`, karena tipe variabelnya interface.', why: 'Interface (tanpa default method) tidak punya implementasi untuk dijalankan.' },
            { text: 'Kompilasi gagal, interface tidak bisa menjadi tipe variabel.', why: 'Interface justru paling sering dipakai sebagai tipe variabel dan parameter.' },
            { text: 'Tergantung urutan import.', why: 'Import tidak memengaruhi dispatch method.' },
          ],
          explanation: 'Ini dynamic dispatch: JVM memanggil method milik class sebenarnya dari object, sehingga satu kode pemanggil bekerja untuk banyak implementasi.',
        },
        {
          kind: 'choice',
          id: 'composition',
          prompt: '`Checkout` butuh kemampuan menagih pembayaran. Desain mana yang paling fleksibel?',
          options: [
            { text: '`Checkout` menyimpan field `PaymentGateway` yang diterima dari constructor.', correct: true },
            { text: '`Checkout extends BankGateway` supaya bisa memanggil `charge` langsung.', why: 'Checkout bukan sejenis gateway. Inheritance mengunci ke satu implementasi.' },
            { text: '`Checkout` membuat `new BankGateway()` di dalam method `pay`.', why: 'Dependency tersembunyi dan tidak bisa diganti dengan fake saat test.' },
            { text: 'Menyalin kode `BankGateway.charge` ke `Checkout`.', why: 'Duplikasi membuat perubahan harus dilakukan di dua tempat.' },
          ],
          explanation: 'Composition + interface: Checkout "punya" gateway dan hanya bergantung pada kontraknya. Implementasi bisa diganti tanpa mengubah Checkout.',
        },
        {
          kind: 'code',
          id: 'fake-gateway',
          prompt: 'Tulis class `FakeGateway` yang mengimplementasikan `PaymentGateway` dan menyimpan jumlah terakhir yang ditagih di field `lastAmount`.',
          language: 'java',
          starter: `interface PaymentGateway {
  void charge(long amount);
}

// TODO: class FakeGateway
`,
          solution: `interface PaymentGateway {
  void charge(long amount);
}

class FakeGateway implements PaymentGateway {
  long lastAmount;

  @Override
  public void charge(long amount) {
    this.lastAmount = amount;
  }
}`,
          checks: [
            { label: '`FakeGateway implements PaymentGateway`', pattern: r`class\s+FakeGateway\s+implements\s+PaymentGateway`, hint: 'Deklarasikan `class FakeGateway implements PaymentGateway { ... }`.' },
            { label: 'Ada field `lastAmount` bertipe `long`', pattern: r`long\s+lastAmount\s*(=\s*\d+\s*)?;`, hint: 'Tambahkan field `long lastAmount;`.' },
            { label: 'Method `charge` bersifat `public`', pattern: r`public\s+void\s+charge\s*\(\s*long\s+\w+\s*\)`, hint: 'Method interface wajib diimplementasikan sebagai `public void charge(long amount)`.' },
            { label: 'Jumlah yang ditagih disimpan ke `lastAmount`', pattern: r`(this\s*\.\s*)?lastAmount\s*=\s*\w+\s*;`, hint: 'Di dalam `charge`, tulis `lastAmount = amount;`.' },
          ],
          explanation: 'Fake seperti ini membuat unit test cepat dan deterministik: test bisa memeriksa `lastAmount` tanpa memanggil bank sungguhan.',
        },
      ],
    },
    {
      slug: 'collections-generics-records',
      title: 'Collections, generics & records',
      summary: 'List, Set, dan Map adalah struktur data harian. Generics menjaga tipe saat kompilasi, dan record membuat data immutable dengan ringkas.',
      minutes: 40,
      objectives: [
        'Memilih `List`, `Set`, atau `Map` sesuai kebutuhan akses data.',
        'Membaca dan menulis tipe generik seperti `Map<Long, Order>`.',
        'Memakai `Optional` dan `record` untuk data yang jelas dan aman.',
      ],
      keyPoints: [
        '`List` menjaga urutan dan boleh duplikat; `Set` hanya elemen unik; `Map` memasangkan key ke value.',
        'Generics memindahkan kesalahan tipe dari runtime ke waktu kompilasi.',
        'Deklarasikan variabel dengan interface (`Map`) dan pilih implementasi (`HashMap`) di sisi kanan.',
        '`record` cocok untuk DTO immutable: constructor, accessor, `equals`, `hashCode`, dan `toString` dibuat otomatis.',
        '`HashMap` tidak aman untuk penulisan serentak dari banyak thread.',
      ],
      practice: {
        task: 'Simpan beberapa `Order` di `Map<Long, Order>` dan buat method `Optional<Order> findById(long id)`.',
        proof: 'ID yang tidak ada mengembalikan `Optional.empty()` dan pemanggil menangani kasus itu tanpa `NullPointerException`.',
      },
      refs: [
        { source: 'collections', note: 'Hierarki Collection dan Map.' },
        { source: 'records', note: 'Record sebagai pembawa data immutable.' },
      ],
      exercises: [
        {
          kind: 'choice',
          id: 'pick-collection',
          prompt: 'Kamu perlu mencari order berdasarkan ID dengan cepat. Struktur data mana yang paling cocok?',
          options: [
            { text: '`Map<Long, Order>`', correct: true },
            { text: '`List<Order>`', why: 'Mencari di List butuh menelusuri elemen satu per satu.' },
            { text: '`Set<Long>`', why: 'Set hanya menyimpan ID, bukan order-nya.' },
            { text: '`Order[]` dengan ukuran tetap', why: 'Array tidak memetakan ID ke object dan ukurannya tidak fleksibel.' },
          ],
          explanation: '`Map` memetakan key ke value. `HashMap` memberi pencarian berdasarkan key yang rata-rata konstan waktunya.',
        },
        {
          kind: 'fill',
          id: 'optional-empty',
          prompt: 'Lengkapi agar method mengembalikan Optional kosong saat order tidak ditemukan.',
          context: `Optional<Order> findById(long id) {
  Order order = orders.get(id);
  return order == null ? ___ : Optional.of(order);
}`,
          answers: ['Optional.empty()', 'Optional.<Order>empty()'],
          placeholder: 'Optional.…',
          hint: 'Factory method Optional untuk nilai kosong.',
          explanation: '`Optional.empty()` membuat ketiadaan nilai eksplisit, sehingga pemanggil dipaksa memutuskan apa yang terjadi bila order tidak ada. Alternatif ringkasnya: `Optional.ofNullable(orders.get(id))`.',
        },
        {
          kind: 'code',
          id: 'order-record',
          prompt: 'Tulis `record OrderLine` dengan komponen `String product` dan `int quantity`. Tambahkan compact constructor yang menolak quantity kurang dari 1.',
          language: 'java',
          starter: `// TODO: record OrderLine
`,
          solution: `public record OrderLine(String product, int quantity) {
  public OrderLine {
    if (quantity < 1) {
      throw new IllegalArgumentException("quantity minimal 1");
    }
  }
}`,
          checks: [
            { label: 'Deklarasi `record OrderLine(String product, int quantity)`', pattern: r`record\s+OrderLine\s*\(\s*String\s+product\s*,\s*int\s+quantity\s*\)`, hint: 'Sintaks record: `record OrderLine(String product, int quantity) { ... }`.' },
            { label: 'Ada compact constructor (tanpa daftar parameter)', pattern: r`(public\s+)?OrderLine\s*\{`, hint: 'Compact constructor ditulis `OrderLine { ... }` atau `public OrderLine { ... }` tanpa tanda kurung.' },
            { label: 'Memeriksa `quantity < 1`', pattern: r`quantity\s*(<\s*1|<=\s*0)`, hint: 'Tambahkan `if (quantity < 1)`.' },
            { label: 'Melempar `IllegalArgumentException`', pattern: r`throw\s+new\s+IllegalArgumentException`, hint: 'Lempar `IllegalArgumentException` bila quantity tidak valid.' },
          ],
          explanation: 'Compact constructor menjalankan validasi sebelum field record di-assign otomatis. Hasilnya: data immutable yang selalu valid.',
        },
      ],
    },
    {
      slug: 'exception-resource-lifecycle',
      title: 'Exception & resource lifecycle',
      summary: 'Exception memisahkan alur gagal dari alur normal. try-with-resources memastikan file, koneksi, dan stream selalu ditutup.',
      minutes: 35,
      objectives: [
        'Membedakan checked dan unchecked exception.',
        'Menutup resource dengan try-with-resources.',
        'Menangani kegagalan tanpa menelan exception.',
      ],
      keyPoints: [
        'Checked exception (mis. `IOException`) wajib ditangani atau dideklarasikan; unchecked (`RuntimeException`) tidak.',
        'try-with-resources menutup resource `AutoCloseable` otomatis, bahkan saat exception terjadi.',
        'Jangan menelan exception dengan `catch` kosong; log, bungkus dengan konteks, atau lempar ulang.',
        'Saat membungkus exception, sertakan penyebab asli (`cause`) agar stack trace tidak hilang.',
      ],
      practice: {
        task: 'Baca file teks berisi daftar produk dengan try-with-resources. Tangani file yang tidak ada dengan pesan yang jelas.',
        proof: 'Resource selalu ditutup, dan pesan error menyebut nama file yang gagal dibaca.',
      },
      refs: [{ source: 'exceptions', note: 'Checked vs unchecked, try-with-resources.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'checked-unchecked',
          prompt: 'Manakah yang termasuk **checked exception**?',
          multiple: true,
          options: [
            { text: '`IOException`', correct: true },
            { text: '`IllegalArgumentException`', why: 'Turunan `RuntimeException`, jadi unchecked.' },
            { text: '`NullPointerException`', why: 'Unchecked; biasanya menandakan bug.' },
            { text: '`java.sql.SQLException`', correct: true },
          ],
          explanation: '`IOException` dan `SQLException` adalah checked: compiler memaksa kamu menangani atau mendeklarasikannya dengan `throws`.',
        },
        {
          kind: 'code',
          id: 'try-with-resources',
          prompt: 'Ubah kode agar `BufferedReader` dibuka dengan try-with-resources sehingga selalu tertutup.',
          language: 'java',
          starter: `String firstLine(Path path) throws IOException {
  BufferedReader reader = Files.newBufferedReader(path);
  String line = reader.readLine();
  reader.close();
  return line;
}`,
          solution: `String firstLine(Path path) throws IOException {
  try (BufferedReader reader = Files.newBufferedReader(path)) {
    return reader.readLine();
  }
}`,
          checks: [
            { label: 'Memakai `try (... reader = ...)`', pattern: r`try\s*\(\s*(BufferedReader|var)\s+reader\s*=\s*Files\s*\.\s*newBufferedReader\s*\(`, hint: 'Tulis `try (BufferedReader reader = Files.newBufferedReader(path)) { ... }`.' },
            { label: 'Tidak memanggil `reader.close()` manual', pattern: r`reader\s*\.\s*close\s*\(`, absent: true, hint: 'try-with-resources menutup reader otomatis; hapus `reader.close()`.' },
            { label: 'Masih membaca baris dengan `readLine()`', pattern: r`reader\s*\.\s*readLine\s*\(\s*\)`, hint: 'Panggil `reader.readLine()` di dalam blok try.' },
          ],
          explanation: 'Pada versi awal, jika `readLine` melempar exception maka `close()` tidak pernah dipanggil. try-with-resources menjamin penutupan di semua jalur.',
        },
        {
          kind: 'choice',
          id: 'swallow',
          prompt: 'Apa masalah utama dari `catch (IOException e) { }`?',
          options: [
            { text: 'Kegagalan hilang tanpa jejak, sehingga bug sulit dilacak dan program lanjut dalam keadaan salah.', correct: true },
            { text: 'Kode tidak bisa dikompilasi.', why: 'Catch kosong valid secara sintaks.' },
            { text: 'Membuat program lebih lambat.', why: 'Masalahnya kebenaran dan observability, bukan performa.' },
            { text: 'Tidak ada masalah selama file biasanya ada.', why: '"Biasanya" bukan jaminan. Kegagalan langka adalah yang paling sulit di-debug.' },
          ],
          explanation: 'Tangani exception dengan sengaja: pulihkan, log dengan konteks, atau bungkus dan lempar ulang (`throw new OrderImportException("Gagal membaca " + path, e)`).',
        },
      ],
    },
  ],
};

export default javaOop;
