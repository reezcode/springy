import type { ModuleInput } from '../types.ts';

const r = String.raw;

const boundaries: ModuleInput = {
  slug: 'batas-microservices',
  title: 'Batas microservices',
  subtitle: 'Pisahkan berdasarkan bisnis dan kebutuhan.',
  description:
    'Kapan microservices layak dibandingkan modular monolith, cara menentukan batas berdasarkan kemampuan bisnis dan kepemilikan data, komunikasi HTTP sinkron dengan timeout, serta syarat deployment independen.',
  category: 'Microservices',
  hours: '4–6',
  tint: 'lavender',
  icon: 'network',
  lessons: [
    {
      slug: 'monolith-atau-microservices',
      title: 'Modular monolith atau microservices?',
      summary: 'Microservices menukar kompleksitas kode dengan kompleksitas operasional. Pahami manfaat dan biayanya sebelum memecah aplikasi.',
      minutes: 35,
      objectives: [
        'Menyebutkan karakteristik microservices menurut Lewis & Fowler.',
        'Membandingkan manfaat dan biaya microservices dengan modular monolith.',
        'Membuat keputusan arsitektur tertulis yang sesuai skala.',
      ],
      keyPoints: [
        'Microservices: aplikasi sebagai kumpulan service kecil yang di-deploy independen, berkomunikasi lewat mekanisme ringan.',
        'Manfaat utama: deployment independen, skala per service, kepemilikan tim yang jelas.',
        'Biaya: jaringan tidak andal, konsistensi data terdistribusi, observability dan operasi yang lebih rumit.',
        'Modular monolith dengan batas modul yang tegas adalah titik awal yang baik; pemisahan bisa dilakukan saat ada alasan nyata.',
      ],
      practice: {
        task: 'Tulis Architecture Decision Record (ADR) singkat: tiga alasan memisahkan Order dan Inventory, serta tiga biaya tambahannya.',
        proof: 'Keputusan tertulis menyebut konteks, pilihan, dan konsekuensi yang sesuai skala kasus Mini Commerce.',
      },
      refs: [{ source: 'micro', note: 'Artikel Lewis & Fowler tentang karakteristik microservices.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'micro-benefit',
          prompt: 'Manakah yang merupakan **manfaat** utama microservices?',
          multiple: true,
          options: [
            { text: 'Setiap service bisa di-deploy tanpa merilis ulang service lain.', correct: true },
            { text: 'Service dengan beban tinggi bisa diskalakan sendiri.', correct: true },
            { text: 'Panggilan antarservice lebih cepat dari panggilan method.', why: 'Panggilan jaringan jauh lebih lambat dan bisa gagal.' },
            { text: 'Konsistensi data otomatis lebih mudah.', why: 'Justru lebih sulit karena data tersebar di banyak database.' },
          ],
          explanation: 'Deployment dan skala independen adalah alasan utama. Harganya adalah komunikasi jaringan dan konsistensi data terdistribusi.',
        },
        {
          kind: 'choice',
          id: 'when-split',
          prompt: 'Tim 3 orang membangun produk baru yang domainnya belum jelas. Pilihan arsitektur yang paling masuk akal adalah…',
          options: [
            { text: 'Modular monolith dengan batas modul yang tegas, lalu pecah bila ada kebutuhan nyata.', correct: true },
            { text: 'Langsung 12 microservices agar siap skala besar.', why: 'Batas yang salah di awal sangat mahal diperbaiki lintas service.' },
            { text: 'Satu class besar tanpa modul.', why: 'Tanpa batas modul, pemisahan di masa depan menjadi sangat sulit.' },
            { text: 'Satu service per tabel database.', why: 'Batas berdasarkan tabel menghasilkan service yang saling bergantung erat.' },
          ],
          explanation: 'Batas domain lebih mudah ditemukan dan diubah di dalam satu codebase. Modular monolith menjaga opsi pemisahan tetap terbuka tanpa biaya operasional di awal.',
        },
      ],
    },
    {
      slug: 'batas-domain-ownership',
      title: 'Batas domain & ownership',
      summary: 'Pilih batas service berdasarkan kemampuan bisnis. Setiap data punya satu pemilik yang berhak mengubahnya.',
      minutes: 40,
      objectives: [
        'Mengidentifikasi kemampuan bisnis (business capability) sebagai kandidat batas.',
        'Menetapkan pemilik tunggal untuk setiap data.',
        'Mengenali coupling akibat batas yang keliru.',
      ],
      keyPoints: [
        'Batas yang baik mengikuti kemampuan bisnis (pemesanan, stok, notifikasi), bukan lapisan teknis atau tabel.',
        'Database per service: hanya pemilik yang membaca/menulis tabelnya; service lain lewat API atau event.',
        'Bounded context: istilah yang sama bisa bermakna berbeda di service berbeda ("produk" di katalog vs di gudang).',
        'Jika dua service selalu harus dirilis bersama, batasnya mungkin salah.',
      ],
      practice: {
        task: 'Gambar diagram ownership data untuk Order, Inventory, dan Notification.',
        proof: 'Tidak ada dua service yang bebas menulis tabel yang sama.',
      },
      refs: [{ source: 'micro', note: 'Bagian "Organized around Business Capabilities" dan "Decentralized Data Management".' }],
      exercises: [
        {
          kind: 'choice',
          id: 'shared-table',
          prompt: 'Order service perlu tahu stok tersedia. Cara mana yang **menjaga** ownership data Inventory?',
          options: [
            { text: 'Memanggil API Inventory (`GET /stock/{sku}`) atau memakai event stok dari Inventory.', correct: true },
            { text: 'Query langsung ke tabel `stock` milik Inventory.', why: 'Ini membuat skema Inventory menjadi kontrak tersembunyi; Inventory tidak bisa mengubah tabelnya dengan aman.' },
            { text: 'Menyalin tabel `stock` ke database Order setiap malam lewat skrip SQL.', why: 'Tetap bergantung pada skema internal dan datanya basi.' },
            { text: 'Memberi Order hak tulis ke tabel `stock` agar bisa mengurangi stok sendiri.', why: 'Dua penulis untuk satu data menghancurkan ownership dan invariant stok.' },
          ],
          explanation: 'Akses lewat API atau event membuat Inventory bebas mengubah skema internalnya selama kontrak publiknya stabil.',
        },
        {
          kind: 'choice',
          id: 'bad-boundary-smell',
          prompt: 'Tanda mana yang menunjukkan batas service **keliru**?',
          multiple: true,
          options: [
            { text: 'Setiap fitur baru selalu mengubah Order dan Inventory sekaligus dan harus dirilis bersama.', correct: true },
            { text: 'Satu request pengguna memicu rantai 6 panggilan sinkron antarservice.', correct: true },
            { text: 'Setiap service punya database sendiri.', why: 'Ini justru ciri batas yang sehat.' },
            { text: 'Tim Inventory bisa merilis tanpa menunggu tim Order.', why: 'Ini tujuan dari pemisahan.' },
          ],
          explanation: 'Perubahan dan rilis yang selalu berpasangan, serta rantai panggilan panjang, adalah gejala *distributed monolith*: biaya microservices tanpa manfaatnya.',
        },
      ],
    },
    {
      slug: 'komunikasi-sinkron',
      title: 'Kontrak komunikasi sinkron',
      summary: 'Panggilan HTTP antarservice harus punya timeout dan pemetaan kegagalan yang disengaja. Jaringan tidak pernah sepenuhnya andal.',
      minutes: 45,
      objectives: [
        'Memanggil service lain dengan `RestClient`.',
        'Mengatur connect timeout dan read timeout.',
        'Memetakan error downstream menjadi error domain.',
      ],
      keyPoints: [
        'Tanpa timeout, thread bisa menunggu selamanya dan habis saat downstream lambat.',
        '`RestClient` (Spring Framework 6.1+) adalah klien HTTP sinkron dengan API fluent.',
        'Gunakan `RestClient.Builder` yang disediakan Spring Boot agar konfigurasi seperti tracing ikut terpasang.',
        'Petakan 4xx/5xx downstream ke exception domain yang bermakna bagi pemanggil.',
        'Rantai panggilan sinkron memperbesar latensi dan peluang gagal (ketersediaan berkalikan).',
      ],
      practice: {
        task: 'Panggil Inventory dari Order lewat HTTP dengan timeout 2 detik.',
        proof: 'Saat Inventory dimatikan atau diperlambat, Order merespons error yang jelas dalam batas waktu, bukan menggantung.',
      },
      refs: [{ source: 'client', note: 'RestClient, timeout, dan penanganan status.' }],
      exercises: [
        {
          kind: 'code',
          id: 'restclient-timeout',
          prompt: 'Buat bean `RestClient` untuk Inventory dengan base URL dari properti dan read timeout 2 detik memakai `SimpleClientHttpRequestFactory`.',
          language: 'java',
          starter: `@Bean
RestClient inventoryClient(RestClient.Builder builder, InventoryProperties props) {
  return builder.build();
}`,
          solution: `@Bean
RestClient inventoryClient(RestClient.Builder builder, InventoryProperties props) {
  var factory = new SimpleClientHttpRequestFactory();
  factory.setConnectTimeout(Duration.ofSeconds(1));
  factory.setReadTimeout(Duration.ofSeconds(2));
  return builder
      .baseUrl(props.baseUrl())
      .requestFactory(factory)
      .build();
}`,
          checks: [
            { label: 'Mengatur `baseUrl(...)` dari properti', pattern: r`\.\s*baseUrl\s*\(\s*props\s*\.\s*baseUrl\s*\(\s*\)\s*\)`, hint: 'Tambahkan `.baseUrl(props.baseUrl())`.' },
            { label: 'Read timeout 2 detik', pattern: r`setReadTimeout\s*\(\s*(Duration\s*\.\s*ofSeconds\s*\(\s*2\s*\)|Duration\s*\.\s*ofMillis\s*\(\s*2000\s*\)|2000\s*\))`, hint: '`factory.setReadTimeout(Duration.ofSeconds(2));`' },
            { label: 'Memasang request factory', pattern: r`\.\s*requestFactory\s*\(\s*\w+\s*\)`, hint: 'Pasang factory ke builder: `.requestFactory(factory)`.' },
          ],
          explanation: 'Connect timeout membatasi waktu membuka koneksi; read timeout membatasi waktu menunggu response. Nilai bisa juga diambil dari `props.timeout()`.',
        },
        {
          kind: 'choice',
          id: 'availability-chain',
          prompt: 'Order memanggil Inventory lalu Payment secara sinkron. Masing-masing tersedia 99%. Berapa kira-kira ketersediaan alur gabungannya (jika Order juga 99%)?',
          options: [
            { text: 'Sekitar 97%', correct: true },
            { text: '99%', why: 'Ketersediaan berantai saling dikalikan: 0,99 × 0,99 × 0,99.' },
            { text: '99,9%', why: 'Menambah dependency tidak menaikkan ketersediaan.' },
            { text: '100%, karena ada tiga service', why: 'Redundansi berbeda dengan rantai dependency.' },
          ],
          explanation: '0,99³ ≈ 0,970. Setiap panggilan sinkron tambahan menurunkan ketersediaan alur. Ini alasan memakai timeout, fallback, dan komunikasi asinkron bila memungkinkan.',
        },
      ],
    },
    {
      slug: 'deployment-data-independen',
      title: 'Deployment & data independen',
      summary: 'Independensi membutuhkan kontrak yang stabil, kompatibilitas mundur, dan kepemilikan data yang jelas.',
      minutes: 35,
      objectives: [
        'Menjelaskan syarat agar service bisa dirilis sendiri.',
        'Menerapkan perubahan kontrak yang kompatibel mundur.',
        'Memilih strategi database per service yang realistis untuk latihan.',
      ],
      keyPoints: [
        'Service bisa dirilis independen hanya jika kontraknya kompatibel dengan versi konsumen yang sedang berjalan.',
        'Perubahan additive (field/endpoint baru) aman; perubahan breaking butuh transisi bertahap.',
        'Database per service bisa berupa server terpisah, atau schema terpisah di server yang sama dengan hak akses tegas.',
        'Consumer-driven contract test membantu mendeteksi perubahan yang merusak konsumen sebelum rilis.',
      ],
      practice: {
        task: 'Ubah format pesan Notification tanpa merilis ulang Order.',
        proof: 'README menjelaskan kontrak antarservice dan hak akses database setiap service.',
      },
      refs: [{ source: 'micro', note: 'Decentralized governance & data management.' }],
      exercises: [
        {
          kind: 'order',
          id: 'rename-field',
          prompt: 'Inventory ingin mengganti field response `qty` menjadi `available`. Urutkan langkah rilis tanpa merusak Order.',
          items: [
            'Inventory mengirim kedua field (`qty` dan `available`).',
            'Order diperbarui untuk membaca `available`.',
            'Pastikan tidak ada konsumen yang masih membaca `qty`.',
            'Inventory menghapus field `qty`.',
          ],
          explanation: 'Pola expand–contract: tambahkan yang baru, migrasikan konsumen, baru hapus yang lama. Setiap langkah bisa dirilis sendiri.',
        },
        {
          kind: 'choice',
          id: 'shared-db-server',
          prompt: 'Untuk latihan, Order dan Inventory memakai satu server PostgreSQL. Bagaimana menjaga kepemilikan data?',
          options: [
            { text: 'Schema dan user database terpisah; user Order tidak punya hak ke schema Inventory.', correct: true },
            { text: 'Satu schema dan satu user untuk semua, cukup sepakat secara lisan.', why: 'Kesepakatan lisan mudah dilanggar; tidak ada yang mencegah query lintas batas.' },
            { text: 'Satu tabel `data` berisi kolom JSON untuk semua service.', why: 'Menghilangkan struktur dan kepemilikan sama sekali.' },
            { text: 'Tidak perlu dipikirkan selama aplikasinya jalan.', why: 'Akses lintas batas yang dibiarkan akan menjadi coupling permanen.' },
          ],
          explanation: 'Berbagi proses database masih bisa diterima untuk latihan atau skala kecil, asalkan batas akses ditegakkan oleh database, bukan hanya konvensi.',
        },
      ],
    },
  ],
};

export default boundaries;
