import type { ModuleInput } from '../types.ts';

const r = String.raw;

const solid: ModuleInput = {
  slug: 'solid',
  title: 'SOLID & desain kode',
  subtitle: 'Kode yang lebih mudah diubah dan diuji.',
  description:
    'Lima prinsip desain dari Robert C. Martin untuk mengelola perubahan: SRP, OCP, LSP, ISP, dan DIP. Fokusnya bukan menghafal singkatan, tetapi mengenali bau kode dan memilih titik ekstensi yang memang dibutuhkan.',
  category: 'Fondasi',
  hours: '4–6',
  tint: 'lavender',
  icon: 'shapes',
  lessons: [
    {
      slug: 'single-responsibility',
      title: 'Single Responsibility Principle',
      summary: 'Satu modul sebaiknya hanya punya satu alasan untuk berubah. Pisahkan aturan bisnis, penyimpanan, dan notifikasi.',
      minutes: 30,
      objectives: [
        'Mengenali class yang punya banyak alasan berubah.',
        'Memecah tanggung jawab menjadi class yang kohesif.',
      ],
      keyPoints: [
        'SRP diukur dari *alasan berubah* (aktor yang meminta perubahan), bukan jumlah method.',
        'Class "Manager" atau "Util" yang serba bisa biasanya melanggar SRP.',
        'Pemisahan membuat perubahan terlokalisasi dan test lebih fokus.',
      ],
      practice: {
        task: 'Pecah `OrderManager` yang menghitung total, menyimpan ke database, dan mengirim email menjadi tiga class terpisah.',
        proof: 'Mengubah template email tidak menyentuh class yang menghitung total order.',
      },
      refs: [{ source: 'solid', note: 'Bagian Single Responsibility Principle.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'srp-reason',
          prompt: 'Menurut SRP, apa ukuran "satu tanggung jawab"?',
          options: [
            { text: 'Satu alasan untuk berubah, biasanya terkait satu pihak yang meminta perubahan.', correct: true },
            { text: 'Satu method per class.', why: 'Class boleh punya banyak method selama semuanya kohesif.' },
            { text: 'Maksimal 100 baris kode.', why: 'Panjang kode bukan ukuran SRP.' },
            { text: 'Satu field per class.', why: 'Jumlah field tidak menentukan tanggung jawab.' },
          ],
          explanation: 'SRP: modul harus bertanggung jawab kepada satu aktor. Jika tim finance dan tim marketing sama-sama bisa memaksa perubahan pada class yang sama, class itu punya dua alasan berubah.',
        },
        {
          kind: 'choice',
          id: 'srp-smell',
          prompt: 'Method mana yang **tidak** cocok berada di class `PriceCalculator`?',
          multiple: true,
          options: [
            { text: '`BigDecimal subtotal(List<OrderLine> lines)`', why: 'Ini memang tugas kalkulator harga.' },
            { text: '`void saveToDatabase(Order order)`', correct: true },
            { text: '`void sendReceiptEmail(Order order)`', correct: true },
            { text: '`BigDecimal applyTax(BigDecimal amount)`', why: 'Perhitungan pajak masih bagian dari kalkulasi harga.' },
          ],
          explanation: 'Penyimpanan dan pengiriman email adalah alasan berubah yang berbeda dari aturan harga. Taruh di repository dan notifier tersendiri.',
        },
      ],
    },
    {
      slug: 'open-closed',
      title: 'Open/Closed Principle',
      summary: 'Terbuka untuk ekstensi, tertutup untuk modifikasi: tambah perilaku baru dengan menambah kode, bukan mengubah kode yang sudah stabil.',
      minutes: 35,
      objectives: [
        'Mengganti rantai `if/else` per jenis dengan polymorphism.',
        'Menambah variasi baru sebagai implementasi baru.',
        'Menghindari abstraksi prematur.',
      ],
      keyPoints: [
        'Titik ekstensi berupa interface membuat variasi baru cukup ditambah sebagai class baru.',
        'Rantai `if (type == ...)` yang terus bertambah adalah tanda OCP dilanggar.',
        'Buat abstraksi untuk variasi yang *sudah* nyata, bukan untuk kemungkinan yang dibayangkan.',
      ],
      practice: {
        task: 'Buat interface `DiscountPolicy` dengan dua implementasi (`NoDiscount`, `MemberDiscount`) dan pakai di `Checkout`.',
        proof: 'Menambah `PromoDiscount` tidak mengubah satu baris pun di `Checkout`.',
      },
      refs: [{ source: 'solid', note: 'Bagian Open-Closed Principle.' }],
      exercises: [
        {
          kind: 'code',
          id: 'promo-discount',
          prompt: 'Tambahkan diskon baru tanpa mengubah `Checkout`: tulis class `PromoDiscount` yang mengimplementasikan `DiscountPolicy` dan memotong 20% dari subtotal.',
          language: 'java',
          starter: `interface DiscountPolicy {
  long apply(long subtotal);
}

class MemberDiscount implements DiscountPolicy {
  public long apply(long subtotal) {
    return subtotal * 90 / 100;
  }
}

// TODO: PromoDiscount (20%)
`,
          solution: `interface DiscountPolicy {
  long apply(long subtotal);
}

class MemberDiscount implements DiscountPolicy {
  public long apply(long subtotal) {
    return subtotal * 90 / 100;
  }
}

class PromoDiscount implements DiscountPolicy {
  @Override
  public long apply(long subtotal) {
    return subtotal * 80 / 100;
  }
}`,
          checks: [
            { label: '`PromoDiscount implements DiscountPolicy`', pattern: r`class\s+PromoDiscount\s+implements\s+DiscountPolicy`, hint: 'Deklarasikan `class PromoDiscount implements DiscountPolicy`.' },
            { label: 'Method `public long apply(long ...)`', pattern: r`class\s+PromoDiscount[\s\S]*public\s+long\s+apply\s*\(\s*long\s+\w+\s*\)`, hint: 'Implementasikan `public long apply(long subtotal)`.' },
            { label: 'Mengembalikan 80% subtotal', pattern: r`class\s+PromoDiscount[\s\S]*return\s+(\w+\s*\*\s*(80\s*\/\s*100|0?\.8\b|4\s*\/\s*5)|\w+\s*-\s*\w+\s*\*\s*20\s*\/\s*100|\(long\)\s*\(\s*\w+\s*\*\s*0?\.8\s*\))`, hint: 'Contoh: `return subtotal * 80 / 100;`.' },
            { label: 'Tidak memakai `instanceof` atau pengecekan jenis', pattern: r`instanceof|getClass\s*\(`, absent: true, hint: 'Variasi ditangani lewat polymorphism, bukan pengecekan tipe.' },
          ],
          explanation: 'Checkout cukup memanggil `policy.apply(subtotal)`. Diskon baru adalah class baru; kode yang sudah teruji tidak disentuh.',
        },
        {
          kind: 'choice',
          id: 'ocp-premature',
          prompt: 'Tim hanya punya satu jenis pengiriman dan belum ada rencana menambah. Apa langkah yang paling bijak?',
          options: [
            { text: 'Tulis implementasi langsung yang sederhana; ekstrak interface saat variasi kedua benar-benar muncul.', correct: true },
            { text: 'Buat interface, factory, dan plugin loader sekarang untuk berjaga-jaga.', why: 'Abstraksi spekulatif menambah kompleksitas tanpa manfaat nyata.' },
            { text: 'Gunakan inheritance tiga level agar fleksibel.', why: 'Hierarki dalam justru membuat perubahan lebih sulit.' },
            { text: 'Salin kode setiap kali butuh variasi.', why: 'Duplikasi melanggar prinsip DRY dan menyulitkan perubahan.' },
          ],
          explanation: 'OCP bukan alasan membuat abstraksi untuk segala hal. Titik ekstensi dibuat ketika variasi sudah terlihat; refactor ke interface saat itu murah.',
        },
      ],
    },
    {
      slug: 'liskov-interface-segregation',
      title: 'Liskov Substitution & Interface Segregation',
      summary: 'Implementasi harus bisa menggantikan kontraknya tanpa kejutan, dan klien hanya bergantung pada operasi yang benar-benar dipakai.',
      minutes: 35,
      objectives: [
        'Mengenali pelanggaran LSP seperti `UnsupportedOperationException`.',
        'Memecah interface gemuk menjadi interface kecil yang fokus.',
      ],
      keyPoints: [
        'LSP: subtipe tidak boleh memperketat syarat input atau melemahkan janji output kontraknya.',
        'Method yang melempar `UnsupportedOperationException` sering menandakan kontrak yang keliru.',
        'ISP: lebih baik beberapa interface kecil (`OrderReader`, `OrderWriter`) daripada satu interface gemuk.',
        'Interface kecil memudahkan membuat fake untuk test.',
      ],
      practice: {
        task: 'Pisahkan interface `OrderRepository` yang berisi baca dan tulis menjadi `OrderReader` dan `OrderWriter`.',
        proof: 'Implementasi laporan read-only tidak punya method tulis palsu.',
      },
      refs: [{ source: 'solid', note: 'Bagian Liskov Substitution dan Interface Segregation.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'lsp-violation',
          prompt: '`ReadOnlyOrderRepository implements OrderRepository` melempar `UnsupportedOperationException` di `save()`. Prinsip mana yang paling jelas dilanggar?',
          options: [
            { text: 'Liskov Substitution: pemanggil `OrderRepository` tidak bisa memakainya tanpa kejutan.', correct: true },
            { text: 'Single Responsibility.', why: 'Class itu hanya punya satu tanggung jawab: membaca.' },
            { text: 'Open/Closed.', why: 'Masalahnya bukan cara menambah variasi.' },
            { text: 'Tidak ada pelanggaran, ini pola standar.', why: 'Kode yang menerima `OrderRepository` akan gagal saat runtime.' },
          ],
          explanation: 'Implementasi melanggar janji kontraknya. Solusinya biasanya ISP: pisahkan interface baca dan tulis sehingga class read-only cukup mengimplementasikan `OrderReader`.',
        },
        {
          kind: 'code',
          id: 'split-interface',
          prompt: 'Pecah interface gemuk menjadi `OrderReader` (method `findById`) dan `OrderWriter` (method `save`).',
          language: 'java',
          starter: `interface OrderRepository {
  Optional<Order> findById(long id);
  void save(Order order);
}`,
          solution: `interface OrderReader {
  Optional<Order> findById(long id);
}

interface OrderWriter {
  void save(Order order);
}`,
          checks: [
            { label: 'Ada `interface OrderReader` dengan `findById`', pattern: r`interface\s+OrderReader\s*\{[^}]*findById\s*\(`, hint: 'Buat `interface OrderReader { Optional<Order> findById(long id); }`.' },
            { label: 'Ada `interface OrderWriter` dengan `save`', pattern: r`interface\s+OrderWriter\s*\{[^}]*void\s+save\s*\(`, hint: 'Buat `interface OrderWriter { void save(Order order); }`.' },
            { label: '`OrderReader` tidak berisi `save`', pattern: r`interface\s+OrderReader\s*\{[^}]*save\s*\(`, absent: true, hint: 'Pindahkan `save` ke `OrderWriter`.' },
            { label: '`OrderWriter` tidak berisi `findById`', pattern: r`interface\s+OrderWriter\s*\{[^}]*findById`, absent: true, hint: 'Pindahkan `findById` ke `OrderReader`.' },
          ],
          explanation: 'Sekarang laporan cukup bergantung pada `OrderReader`, dan repository JPA bisa mengimplementasikan keduanya. Tidak ada method palsu.',
        },
      ],
    },
    {
      slug: 'dependency-inversion',
      title: 'Dependency Inversion Principle',
      summary: 'Kebijakan bisnis bergantung pada abstraksi; detail teknis mengimplementasikan abstraksi itu.',
      minutes: 35,
      objectives: [
        'Membalik arah dependency dari detail ke abstraksi.',
        'Membedakan DIP (prinsip desain) dan DI (mekanisme).',
        'Menyuntikkan dependency lewat constructor.',
      ],
      keyPoints: [
        'Modul tingkat tinggi (aturan bisnis) tidak bergantung pada modul tingkat rendah (database, HTTP); keduanya bergantung pada abstraksi.',
        'Abstraksi sebaiknya dimiliki oleh sisi bisnis dan dinamai dengan bahasa bisnis.',
        'Constructor injection membuat dependency eksplisit dan object langsung lengkap.',
        'DI adalah mekanisme (siapa yang membuat object); DIP adalah keputusan arah dependency.',
      ],
      practice: {
        task: 'Ubah `Checkout` yang membuat `new BankGateway()` di dalamnya menjadi menerima `PaymentGateway` lewat constructor.',
        proof: 'Unit test `Checkout` memakai `FakeGateway` tanpa koneksi jaringan.',
      },
      refs: [
        { source: 'solid', note: 'Bagian Dependency Inversion Principle.' },
        { source: 'di', note: 'Constructor-based dependency injection di Spring.' },
      ],
      exercises: [
        {
          kind: 'code',
          id: 'constructor-injection',
          prompt: 'Refactor `Checkout` agar tidak membuat `BankGateway` sendiri. Terima `PaymentGateway` lewat constructor dan simpan di field `private final`.',
          language: 'java',
          starter: `class Checkout {
  private final BankGateway gateway = new BankGateway();

  void pay(long amount) {
    gateway.charge(amount);
  }
}`,
          solution: `class Checkout {
  private final PaymentGateway gateway;

  Checkout(PaymentGateway gateway) {
    this.gateway = gateway;
  }

  void pay(long amount) {
    gateway.charge(amount);
  }
}`,
          checks: [
            { label: 'Field bertipe interface: `private final PaymentGateway`', pattern: r`private\s+final\s+PaymentGateway\s+\w+\s*;`, hint: 'Ganti tipe field menjadi `PaymentGateway` dan hapus inisialisasi `new`.' },
            { label: 'Constructor menerima `PaymentGateway`', pattern: r`Checkout\s*\(\s*(final\s+)?PaymentGateway\s+\w+\s*\)`, hint: 'Tambahkan `Checkout(PaymentGateway gateway) { ... }`.' },
            { label: 'Constructor meng-assign field', pattern: r`this\s*\.\s*\w+\s*=\s*\w+\s*;`, hint: 'Di constructor: `this.gateway = gateway;`.' },
            { label: 'Tidak ada `new BankGateway()` di dalam Checkout', pattern: r`new\s+BankGateway`, absent: true, hint: 'Pembuatan gateway dipindahkan ke luar Checkout (composition root atau Spring).' },
          ],
          explanation: 'Checkout sekarang hanya mengenal kontrak. Siapa yang membuat implementasinya diputuskan di luar, oleh `main`, test, atau container Spring.',
        },
        {
          kind: 'choice',
          id: 'di-vs-dip',
          prompt: 'Pernyataan mana yang benar tentang DI dan DIP?',
          options: [
            { text: 'DI adalah mekanisme menyediakan dependency dari luar; DIP adalah prinsip tentang arah dependency ke abstraksi.', correct: true },
            { text: 'Keduanya sama persis, hanya singkatan berbeda.', why: 'DI bisa dipakai tanpa DIP, misalnya menyuntikkan class konkret.' },
            { text: 'DIP hanya bisa diterapkan dengan Spring.', why: 'DIP adalah prinsip desain; bisa diterapkan dengan Java biasa.' },
            { text: 'DI berarti memakai inheritance.', why: 'DI tidak terkait inheritance.' },
          ],
          explanation: 'Menyuntikkan `BankGateway` konkret tetap DI, tetapi belum DIP. DIP tercapai ketika Checkout bergantung pada `PaymentGateway` yang dimiliki sisi bisnis.',
        },
        {
          kind: 'order',
          id: 'refactor-steps',
          prompt: 'Urutkan langkah refactor aman untuk menerapkan DIP pada `Checkout`.',
          items: [
            'Tulis test karakterisasi untuk perilaku `Checkout` saat ini.',
            'Ekstrak interface `PaymentGateway` dari method yang dipakai Checkout.',
            'Buat `BankGateway` mengimplementasikan interface tersebut.',
            'Ubah Checkout agar menerima `PaymentGateway` lewat constructor.',
            'Ganti test agar memakai `FakeGateway` dan jalankan semuanya lagi.',
          ],
          explanation: 'Test lebih dulu memastikan perilaku tidak berubah. Setelah itu abstraksi diekstrak, implementasi disesuaikan, dan dependency dipindah ke constructor.',
        },
      ],
    },
  ],
};

export default solid;
