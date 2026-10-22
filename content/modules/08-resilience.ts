import type { ModuleInput } from '../types.ts';

const r = String.raw;

const resilience: ModuleInput = {
  slug: 'resilience-messaging',
  title: 'Resilience & messaging',
  subtitle: 'Tangani timeout, request berulang, dan pesan duplikat.',
  description:
    'Atur retry dan idempotency key agar request aman diulang. Pelajari circuit breaker, publisher confirm, dan consumer acknowledgement, lalu gunakan outbox dan saga untuk mengatur perubahan data lintas service.',
  category: 'Microservices',
  hours: '8–12',
  tint: 'blue',
  icon: 'activity',
  lessons: [
    {
      slug: 'timeout-retry-idempotency',
      title: 'Timeout, retry & idempotency',
      summary: 'Retry membantu kegagalan sementara, tetapi operasi yang diulang harus aman dari efek ganda. Idempotency key membuat POST bisa diulang.',
      minutes: 45,
      objectives: [
        'Memilih kegagalan yang layak di-retry.',
        'Mengonfigurasi retry dengan batas percobaan dan backoff.',
        'Menerapkan idempotency key untuk `POST /orders`.',
      ],
      keyPoints: [
        'Retry hanya untuk kegagalan sementara (timeout, 503); jangan retry 400 atau 409.',
        'Selalu batasi jumlah percobaan dan beri jeda yang bertambah (exponential backoff + jitter).',
        'Timeout tidak berarti gagal: server mungkin sudah memproses request.',
        'Idempotency key memetakan satu operasi logis ke satu hasil, walau request dikirim berkali-kali.',
        'Penyimpanan key harus atomik dan bersama untuk semua replica; Map di memori tidak cukup.',
      ],
      practice: {
        task: 'Implementasikan header `Idempotency-Key` pada `POST /orders` dengan tabel `idempotency_keys` yang memiliki unique constraint.',
        proof: 'Mengirim ulang request dengan key sama menghasilkan satu order; payload berbeda dengan key sama ditolak 409.',
      },
      refs: [{ source: 'retry', note: 'Konfigurasi retry, backoff, dan exception yang di-retry.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'retryable',
          prompt: 'Respons mana yang **layak** di-retry otomatis oleh klien?',
          multiple: true,
          options: [
            { text: '503 Service Unavailable', correct: true },
            { text: 'Timeout membaca response', correct: true },
            { text: '400 Bad Request', why: 'Request yang sama akan selalu ditolak.' },
            { text: '409 Conflict karena stok habis', why: 'Kondisi bisnis tidak berubah dengan mengulang seketika.' },
          ],
          explanation: 'Retry masuk akal untuk kegagalan yang mungkin hilang sendiri. Untuk operasi tidak idempotent seperti POST, retry setelah timeout butuh idempotency key.',
        },
        {
          kind: 'choice',
          id: 'timeout-meaning',
          prompt: 'Klien mengirim `POST /orders` lalu mendapat timeout. Apa yang **pasti** benar?',
          options: [
            { text: 'Klien tidak tahu apakah order sudah dibuat atau belum.', correct: true },
            { text: 'Order pasti belum dibuat.', why: 'Server bisa saja sudah menyimpan order, hanya response-nya yang terlambat.' },
            { text: 'Order pasti sudah dibuat.', why: 'Request bisa saja hilang sebelum sampai ke server.' },
            { text: 'Server pasti mati.', why: 'Timeout bisa disebabkan jaringan, beban, atau GC pause.' },
          ],
          explanation: 'Ketidakpastian inilah yang membuat retry POST berbahaya tanpa idempotency key: mengulang bisa membuat order ganda.',
        },
        {
          kind: 'code',
          id: 'retry-config',
          prompt: 'Konfigurasikan instance Resilience4j Retry bernama `inventory`: maksimal 3 percobaan, jeda awal 200ms, exponential backoff aktif.',
          language: 'yaml',
          starter: `resilience4j:
  retry:
    instances:
      inventory:
        # TODO
`,
          solution: `resilience4j:
  retry:
    instances:
      inventory:
        maxAttempts: 3
        waitDuration: 200ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2`,
          checks: [
            { label: '`maxAttempts: 3`', pattern: r`^\s+max-?[aA]ttempts\s*:\s*3\s*$`, hint: 'Tambahkan `maxAttempts: 3` (termasuk percobaan pertama).' },
            { label: '`waitDuration: 200ms`', pattern: r`^\s+wait-?[dD]uration\s*:\s*(200ms|0\.2s|PT0\.2S)\s*$`, hint: 'Tambahkan `waitDuration: 200ms`.' },
            { label: '`enableExponentialBackoff: true`', pattern: r`^\s+enable-?[eE]xponential-?[bB]ackoff\s*:\s*true\s*$`, hint: 'Tambahkan `enableExponentialBackoff: true`.' },
            { label: 'Berada di bawah `instances.inventory`', pattern: r`instances\s*:\s*\n\s+inventory\s*:\s*\n[\s\S]*max-?[aA]ttempts`, hint: 'Letakkan properti di bawah `inventory:` dengan indentasi lebih dalam.' },
          ],
          explanation: '`maxAttempts` menghitung percobaan pertama. Dengan multiplier 2, jedanya kira-kira 200ms lalu 400ms. Tambahkan jitter agar banyak klien tidak mengulang serentak.',
        },
      ],
    },
    {
      slug: 'circuit-breaker',
      title: 'Circuit breaker',
      summary: 'Saat dependency sering gagal, berhenti memanggilnya sementara. Circuit breaker melindungi pemanggil dan memberi waktu dependency pulih.',
      minutes: 40,
      objectives: [
        'Menjelaskan state CLOSED, OPEN, dan HALF_OPEN.',
        'Membaca konfigurasi sliding window dan threshold.',
        'Menyediakan fallback yang masuk akal.',
      ],
      keyPoints: [
        'CLOSED: panggilan diteruskan dan hasilnya dicatat dalam sliding window.',
        'OPEN: setelah failure rate melewati ambang, panggilan langsung ditolak tanpa memanggil dependency.',
        'HALF_OPEN: setelah waktu tunggu, sejumlah panggilan percobaan menentukan kembali ke CLOSED atau OPEN.',
        '`minimumNumberOfCalls` mencegah circuit terbuka karena sampel yang terlalu sedikit.',
        'Circuit breaker tidak membatasi concurrency; itu tugas bulkhead.',
      ],
      practice: {
        task: 'Di playground, kirim empat panggilan dengan dua kegagalan, lalu ikuti siklus sampai circuit kembali CLOSED.',
        proof: 'Bisa menjelaskan transisi CLOSED → OPEN → HALF_OPEN → CLOSED/OPEN dan apa yang memicunya.',
      },
      refs: [{ source: 'cb', note: 'State machine, sliding window, dan konfigurasi CircuitBreaker.' }],
      exercises: [
        {
          kind: 'order',
          id: 'breaker-cycle',
          prompt: 'Urutkan kejadian siklus circuit breaker ketika dependency gagal lalu pulih.',
          items: [
            'Circuit CLOSED, panggilan diteruskan dan dicatat.',
            'Failure rate melewati ambang setelah jumlah panggilan minimum.',
            'Circuit OPEN, panggilan langsung ditolak.',
            'Waktu tunggu habis, circuit menjadi HALF_OPEN.',
            'Panggilan percobaan berhasil, circuit kembali CLOSED.',
          ],
          explanation: 'Jika panggilan percobaan di HALF_OPEN gagal, circuit kembali OPEN dan menunggu lagi.',
        },
        {
          kind: 'choice',
          id: 'open-behaviour',
          prompt: 'Saat circuit untuk Inventory dalam state OPEN, apa yang terjadi pada panggilan baru?',
          options: [
            { text: 'Ditolak seketika dengan `CallNotPermittedException`, tanpa request ke Inventory.', correct: true },
            { text: 'Dikirim ke Inventory dengan timeout lebih panjang.', why: 'Tujuan OPEN justru berhenti membebani dependency.' },
            { text: 'Diantrekan sampai circuit tertutup.', why: 'Circuit breaker tidak mengantrekan panggilan.' },
            { text: 'Dikirim ke instance Inventory lain.', why: 'Itu load balancing, bukan circuit breaker.' },
          ],
          explanation: 'Gagal cepat membebaskan thread pemanggil dan memberi Inventory ruang untuk pulih. Fallback bisa memberi respons alternatif.',
        },
        {
          kind: 'fill',
          id: 'min-calls',
          prompt: 'Properti Resilience4j apa yang menentukan jumlah panggilan minimum sebelum failure rate dihitung?',
          answers: ['minimumNumberOfCalls', 'minimum-number-of-calls'],
          placeholder: 'namaProperti',
          hint: 'Diawali kata "minimum".',
          explanation: 'Tanpa `minimumNumberOfCalls`, satu kegagalan dari satu panggilan sudah berarti failure rate 100% dan circuit terbuka terlalu cepat.',
        },
      ],
    },
    {
      slug: 'event-ack-duplikasi',
      title: 'Event, acknowledgement & duplikasi',
      summary: 'Publisher confirm memastikan broker menerima pesan; consumer acknowledgement memastikan pesan selesai diproses. Redelivery membuat consumer harus tahan duplikat.',
      minutes: 45,
      objectives: [
        'Membedakan publisher confirm dan consumer acknowledgement di RabbitMQ.',
        'Menentukan kapan melakukan ack.',
        'Membuat consumer idempotent.',
      ],
      keyPoints: [
        'Publisher confirm: broker memberi tahu publisher bahwa pesan sudah diterima dan ditangani broker.',
        'Consumer ack: consumer memberi tahu broker bahwa pesan selesai diproses dan boleh dihapus.',
        'Ack setelah pemrosesan selesai; ack terlalu awal membuat pesan hilang saat consumer crash.',
        'Pengiriman yang realistis adalah *at-least-once*: pesan bisa datang lebih dari sekali.',
        'Consumer idempotent mencatat ID pesan yang sudah diproses dan mengabaikan duplikat.',
      ],
      practice: {
        task: 'Matikan consumer Notification setelah memproses pesan tetapi sebelum ack, lalu nyalakan lagi.',
        proof: 'Pesan dikirim ulang oleh broker, tetapi notifikasi tidak terkirim dua kali.',
      },
      refs: [{ source: 'mq', note: 'Publisher confirms, consumer acknowledgements, dan redelivery.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'ack-timing',
          prompt: 'Consumer melakukan ack **sebelum** mengirim email, lalu crash saat mengirim. Apa akibatnya?',
          options: [
            { text: 'Pesan sudah dihapus broker, sehingga email tidak pernah terkirim.', correct: true },
            { text: 'Broker mengirim ulang pesan otomatis.', why: 'Setelah ack, broker menganggap pesan selesai.' },
            { text: 'Email terkirim dua kali.', why: 'Itu risiko ack terlambat, bukan ack terlalu awal.' },
            { text: 'Tidak ada akibat.', why: 'Pekerjaan hilang tanpa jejak.' },
          ],
          explanation: 'Ack setelah pekerjaan selesai menukar risiko "hilang" dengan risiko "duplikat". Duplikat bisa ditangani dengan idempotency; pesan hilang tidak bisa dipulihkan.',
        },
        {
          kind: 'code',
          id: 'idempotent-consumer',
          prompt: 'Buat consumer idempotent: lewati pesan jika `processed.existsById(event.id())` bernilai true; jika belum, kirim notifikasi lalu simpan ID-nya.',
          language: 'java',
          starter: `@RabbitListener(queues = "order-confirmed")
@Transactional
public void on(OrderConfirmed event) {
  notifier.send(event.customerId(), event.orderId());
}`,
          solution: `@RabbitListener(queues = "order-confirmed")
@Transactional
public void on(OrderConfirmed event) {
  if (processed.existsById(event.id())) {
    return;
  }
  notifier.send(event.customerId(), event.orderId());
  processed.save(new ProcessedMessage(event.id()));
}`,
          checks: [
            { label: 'Memeriksa `processed.existsById(event.id())`', pattern: r`if\s*\(\s*processed\s*\.\s*existsById\s*\(\s*event\s*\.\s*id\s*\(\s*\)\s*\)\s*\)`, hint: 'Tambahkan `if (processed.existsById(event.id()))` di awal method.' },
            { label: 'Keluar lebih awal untuk duplikat', pattern: r`existsById[^;]*\)\s*\)\s*\{?\s*return\s*;`, hint: 'Di dalam if, cukup `return;`.' },
            { label: 'Menyimpan ID setelah diproses', pattern: r`processed\s*\.\s*save\s*\(`, hint: 'Setelah mengirim, panggil `processed.save(new ProcessedMessage(event.id()))`.' },
            { label: 'Simpan dilakukan setelah `notifier.send`', pattern: r`notifier\s*\.\s*send[\s\S]*processed\s*\.\s*save`, hint: 'Urutan: periksa → proses → simpan ID.' },
          ],
          explanation: 'Unique constraint pada tabel ID pesan mencegah dua consumer mencatat ID pesan yang sama secara bersamaan. Untuk efek eksternal seperti email, tambahkan juga idempotency key di penyedia email bila didukung.',
        },
      ],
    },
    {
      slug: 'outbox-saga',
      title: 'Outbox, saga & eventual consistency',
      summary: 'Outbox menyimpan perubahan bisnis dan event dalam satu transaksi lokal. Saga mengoordinasikan beberapa transaksi lokal dengan langkah kompensasi.',
      minutes: 50,
      objectives: [
        'Menjelaskan masalah dual write antara database dan broker.',
        'Menerapkan pola transactional outbox.',
        'Merancang saga dengan langkah kompensasi.',
      ],
      keyPoints: [
        'Dual write (simpan ke DB lalu publish ke broker) bisa gagal di tengah dan meninggalkan data tidak konsisten.',
        'Outbox: tulis event ke tabel outbox dalam transaksi yang sama dengan perubahan bisnis; relay memublikasikannya kemudian.',
        'Relay bisa mengirim ulang, jadi consumer tetap harus idempotent.',
        'Saga: rangkaian transaksi lokal; jika satu langkah gagal, jalankan kompensasi untuk langkah sebelumnya.',
        'Kompensasi bukan rollback ACID; ia adalah aksi bisnis baru (misalnya melepas reservasi).',
      ],
      practice: {
        task: 'Tulis alur order → reservasi stok → pembayaran, lengkap dengan kompensasi saat pembayaran gagal.',
        proof: 'Ada jalur pemulihan tertulis dan teruji: stok dilepas dan order dibatalkan ketika pembayaran gagal.',
      },
      refs: [
        { source: 'outbox', note: 'Pola transactional outbox dan message relay.' },
        { source: 'saga', note: 'Choreography vs orchestration saga.' },
      ],
      exercises: [
        {
          kind: 'choice',
          id: 'dual-write',
          prompt: 'Service menyimpan order ke database (commit sukses) lalu publish `OrderCreated` ke broker, tetapi broker sedang down. Apa masalahnya?',
          options: [
            { text: 'Order tersimpan tetapi event tidak pernah terbit, sehingga service lain tidak tahu.', correct: true },
            { text: 'Database otomatis rollback.', why: 'Transaksi sudah commit sebelum publish.' },
            { text: 'Broker akan mengambil event dari database sendiri.', why: 'Broker tidak membaca database aplikasi.' },
            { text: 'Tidak ada masalah karena retry pasti berhasil.', why: 'Jika aplikasi crash sebelum retry, event hilang.' },
          ],
          explanation: 'Ini masalah *dual write*. Outbox menyelesaikannya: event ditulis ke tabel dalam transaksi yang sama, lalu relay memublikasikannya sampai berhasil.',
        },
        {
          kind: 'order',
          id: 'saga-compensation',
          prompt: 'Pembayaran gagal setelah stok direservasi. Urutkan langkah saga beserta kompensasinya.',
          items: [
            'Order dibuat dengan status PENDING.',
            'Inventory mereservasi stok.',
            'Payment gagal menagih.',
            'Inventory melepas reservasi stok (kompensasi).',
            'Order diubah menjadi CANCELLED (kompensasi).',
          ],
          explanation: 'Setiap langkah adalah transaksi lokal di service masing-masing. Kompensasi dijalankan dalam urutan terbalik untuk langkah yang sudah berhasil.',
        },
        {
          kind: 'code',
          id: 'outbox-write',
          prompt: 'Dalam method `@Transactional`, simpan order **dan** tulis event ke `outbox` dalam transaksi yang sama. Jangan publish langsung ke broker.',
          language: 'java',
          starter: `@Transactional
public Long place(CreateOrderRequest request) {
  Order order = orders.save(new Order(request.product(), request.quantity()));
  rabbitTemplate.convertAndSend("orders", "order.created", new OrderCreated(order.getId()));
  return order.getId();
}`,
          solution: `@Transactional
public Long place(CreateOrderRequest request) {
  Order order = orders.save(new Order(request.product(), request.quantity()));
  outbox.save(OutboxMessage.of("order.created", new OrderCreated(order.getId())));
  return order.getId();
}`,
          checks: [
            { label: 'Method tetap `@Transactional`', pattern: r`@Transactional[\s\S]*public\s+Long\s+place`, hint: 'Pertahankan `@Transactional`.' },
            { label: 'Menyimpan order', pattern: r`orders\s*\.\s*save\s*\(`, hint: 'Simpan order dengan `orders.save(...)`.' },
            { label: 'Menulis ke `outbox.save(...)`', pattern: r`outbox\s*\.\s*save\s*\(`, hint: 'Tulis event: `outbox.save(OutboxMessage.of("order.created", ...))`.' },
            { label: 'Tidak publish langsung ke broker', pattern: r`rabbitTemplate|kafkaTemplate|convertAndSend`, absent: true, hint: 'Hapus `rabbitTemplate.convertAndSend`; relay outbox yang akan memublikasikan.' },
          ],
          explanation: 'Order dan event kini atomik: keduanya commit atau keduanya batal. Relay terpisah membaca tabel outbox dan memublikasikan ke broker, lalu menandai baris sebagai terkirim.',
        },
      ],
    },
  ],
};

export default resilience;
