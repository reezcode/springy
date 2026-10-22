import type { ModuleInput } from '../types.ts';

const r = String.raw;

const observability: ModuleInput = {
  slug: 'observability',
  title: 'Observability',
  subtitle: 'Cari penyebab error lewat health, logs, metrics, dan traces.',
  description:
    'Tambahkan endpoint Actuator, baca logs dan metrics, lalu ikuti request antarservice dengan distributed tracing. Atur juga liveness, readiness, dan startup probe agar platform bisa memeriksa kondisi aplikasi.',
  category: 'Operasional',
  hours: '4–6',
  tint: 'mint',
  icon: 'chart',
  lessons: [
    {
      slug: 'health-endpoint',
      title: 'Health & endpoint operasional',
      summary: 'Actuator menyediakan endpoint untuk memeriksa kesehatan dan kondisi aplikasi. Ekspos secukupnya dan lindungi sisanya.',
      minutes: 30,
      objectives: [
        'Mengaktifkan dan mengekspos endpoint Actuator yang diperlukan.',
        'Membaca hasil `/actuator/health` beserta komponennya.',
        'Membatasi exposure dan detail endpoint operasional.',
      ],
      keyPoints: [
        'Secara default hanya `health` yang diekspos lewat HTTP.',
        '`management.endpoints.web.exposure.include` menentukan endpoint yang terbuka.',
        'Health indicator otomatis memeriksa datasource, disk, broker, dan lainnya.',
        '`show-details` sebaiknya `when-authorized` atau `never` untuk akses publik.',
        'Jangan pakai exposure `*` pada aplikasi yang terbuka ke internet.',
      ],
      practice: {
        task: 'Aktifkan `health` dan `info`, lalu periksa `/actuator/health` saat database hidup dan mati.',
        proof: 'Status berubah dari UP menjadi DOWN saat database dimatikan, tanpa membuka endpoint sensitif lain.',
      },
      refs: [{ source: 'actuator', note: 'Daftar endpoint, exposure, dan keamanan Actuator.' }],
      exercises: [
        {
          kind: 'code',
          id: 'exposure',
          prompt: 'Konfigurasikan Actuator agar hanya `health` dan `info` yang diekspos lewat web, dan detail health hanya ditampilkan untuk pengguna terotorisasi.',
          language: 'yaml',
          starter: `management:
  endpoints:
    web:
      exposure:
        include: "*"`,
          solution: `management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when-authorized`,
          checks: [
            { label: '`include: health,info`', pattern: r`^\s+include\s*:\s*["']?health\s*,\s*info["']?\s*$`, hint: 'Ganti `"*"` dengan `health,info`.' },
            { label: 'Tidak ada wildcard `*`', pattern: r`include\s*:\s*["']?\*`, absent: true, hint: 'Hapus wildcard; ekspos hanya endpoint yang dibutuhkan.' },
            { label: '`show-details: when-authorized`', pattern: r`^\s+show-?[dD]etails\s*:\s*when[-_]authorized\s*$`, hint: 'Tambahkan `management.endpoint.health.show-details: when-authorized`.' },
          ],
          explanation: 'Endpoint seperti `env`, `heapdump`, dan `configprops` bisa membocorkan secret atau data memori. Ekspos hanya yang perlu, dan lindungi dengan Spring Security atau port manajemen terpisah.',
        },
        {
          kind: 'choice',
          id: 'health-down',
          prompt: 'Database mati. Apa yang ditampilkan `/actuator/health` secara default (dengan health indicator datasource aktif)?',
          options: [
            { text: 'Status `DOWN` dengan HTTP 503.', correct: true },
            { text: 'Status `UP`, karena aplikasinya masih berjalan.', why: 'Status agregat mengikuti komponen terburuk, termasuk `db`.' },
            { text: 'HTTP 404.', why: 'Endpoint tetap ada; hanya statusnya yang berubah.' },
            { text: 'Aplikasi otomatis restart.', why: 'Actuator hanya melaporkan; restart diputuskan platform berdasarkan probe.' },
          ],
          explanation: 'Status DOWN dipetakan ke HTTP 503 sehingga load balancer dan monitoring bisa bereaksi.',
        },
      ],
    },
    {
      slug: 'logs-metrics-traces',
      title: 'Logs, metrics & traces',
      summary: 'Tiga sinyal yang saling melengkapi: log mencatat kejadian, metrics merangkum angka, trace mengikuti perjalanan satu request.',
      minutes: 40,
      objectives: [
        'Memilih sinyal yang tepat untuk pertanyaan yang berbeda.',
        'Menulis log terstruktur dengan konteks yang cukup.',
        'Membuat metrics kustom dengan Micrometer.',
      ],
      keyPoints: [
        'Metrics menjawab "seberapa sering/seberapa lama"; merangkum data numerik dan cocok untuk alert.',
        'Log menjawab "apa yang terjadi pada kejadian ini"; detail tetapi mahal pada volume besar.',
        'Trace menjawab "di mana waktu habis dalam satu request lintas service".',
        'Log terstruktur (JSON) dengan trace ID memudahkan pencarian dan korelasi.',
        'Jangan menulis token, password, atau data pribadi ke log.',
      ],
      practice: {
        task: 'Catat satu request gagal dan cari log-nya berdasarkan trace ID.',
        proof: 'Bisa mengikuti request dari Order ke Inventory lewat trace ID yang sama.',
      },
      refs: [{ source: 'trace', note: 'Micrometer Observation, tracing, dan korelasi log.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'pick-signal',
          prompt: 'Kamu ingin alert ketika lebih dari 5% request `POST /orders` gagal dalam 5 menit. Sinyal mana yang paling cocok?',
          options: [
            { text: 'Metrics (counter/timer dengan tag status)', correct: true },
            { text: 'Membaca seluruh log secara manual setiap 5 menit', why: 'Tidak skalabel dan lambat untuk alert.' },
            { text: 'Satu trace dari request terakhir', why: 'Satu trace tidak mewakili tingkat kegagalan.' },
            { text: 'Heap dump', why: 'Heap dump untuk analisis memori, bukan tingkat error.' },
          ],
          explanation: 'Spring Boot sudah mencatat `http.server.requests` dengan tag `uri`, `method`, dan `status`. Rasio error bisa dihitung di backend metrics seperti Prometheus.',
        },
        {
          kind: 'code',
          id: 'custom-counter',
          prompt: 'Buat counter Micrometer `orders.created` yang bertambah setiap order dibuat. Gunakan `MeterRegistry` dari constructor.',
          language: 'java',
          starter: `@Service
class PlaceOrder {
  private final OrderRepository orders;

  PlaceOrder(OrderRepository orders) {
    this.orders = orders;
  }

  public Long handle(CreateOrderRequest request) {
    Order order = orders.save(new Order(request.product(), request.quantity()));
    return order.getId();
  }
}`,
          solution: `@Service
class PlaceOrder {
  private final OrderRepository orders;
  private final Counter created;

  PlaceOrder(OrderRepository orders, MeterRegistry registry) {
    this.orders = orders;
    this.created = registry.counter("orders.created");
  }

  public Long handle(CreateOrderRequest request) {
    Order order = orders.save(new Order(request.product(), request.quantity()));
    created.increment();
    return order.getId();
  }
}`,
          checks: [
            { label: 'Constructor menerima `MeterRegistry`', pattern: r`PlaceOrder\s*\([^)]*MeterRegistry\s+\w+[^)]*\)`, hint: 'Tambahkan parameter `MeterRegistry registry` di constructor.' },
            { label: 'Membuat counter `orders.created`', pattern: r`\.\s*counter\s*\(\s*"orders\.created"|Counter\s*\.\s*builder\s*\(\s*"orders\.created"`, hint: '`registry.counter("orders.created")`.' },
            { label: 'Memanggil `increment()`', pattern: r`\.\s*increment\s*\(\s*\)`, hint: 'Setelah order tersimpan, panggil `created.increment()`.' },
          ],
          explanation: 'Dengan registry Prometheus, metrics ini tersedia sebagai `orders_created_total`. Hindari tag dengan kardinalitas tinggi seperti ID order.',
        },
        {
          kind: 'choice',
          id: 'log-sensitive',
          prompt: 'Baris log mana yang **aman**?',
          options: [
            { text: '`log.info("Order created orderId={} items={}", id, count)`', correct: true },
            { text: '`log.info("Request headers: {}", headers)` termasuk Authorization', why: 'Header Authorization berisi token akses.' },
            { text: '`log.debug("Login password={}", password)`', why: 'Password tidak boleh pernah ditulis ke log.' },
            { text: '`log.info("Customer {}", customer)` dengan toString berisi NIK dan alamat', why: 'Data pribadi di log menimbulkan risiko privasi dan kepatuhan.' },
          ],
          explanation: 'Log menyebar ke banyak sistem dan sering disimpan lama dengan akses yang luas. Catat ID dan konteks teknis, bukan secret atau data pribadi.',
        },
      ],
    },
    {
      slug: 'tracing-antarservice',
      title: 'Tracing antarservice',
      summary: 'Distributed tracing menyambungkan span dari beberapa service menjadi satu trace, sehingga kamu bisa menemukan operasi yang lambat atau gagal.',
      minutes: 40,
      objectives: [
        'Menjelaskan trace, span, dan propagasi konteks.',
        'Mengaktifkan Micrometer Tracing dan exporter.',
        'Memastikan propagasi dengan builder HTTP yang diautokonfigurasi.',
      ],
      keyPoints: [
        'Trace = seluruh perjalanan request; span = satu unit kerja di dalamnya.',
        'Konteks trace diteruskan lewat header (W3C `traceparent`) pada setiap panggilan keluar.',
        'Gunakan `RestClient.Builder` dari Spring Boot agar header tracing ditambahkan otomatis.',
        'Sampling menentukan proporsi request yang direkam; default Spring Boot 10%.',
        'Trace ID di log menghubungkan trace dengan log yang relevan.',
      ],
      practice: {
        task: 'Hubungkan Order dan Inventory ke backend trace (misalnya Zipkin atau Jaeger lewat OTLP).',
        proof: 'Satu trace menampilkan span dari kedua service untuk satu request pembuatan order.',
      },
      refs: [{ source: 'trace', note: 'Konfigurasi tracer, exporter, sampling, dan propagasi.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'broken-propagation',
          prompt: 'Trace Order dan Inventory muncul sebagai dua trace terpisah, bukan satu. Penyebab paling mungkin adalah…',
          options: [
            { text: 'Order membuat `RestClient` dengan `RestClient.create()` sehingga header trace tidak ditambahkan.', correct: true },
            { text: 'Inventory memakai port yang berbeda.', why: 'Port tidak memengaruhi propagasi konteks.' },
            { text: 'Database Order dan Inventory berbeda.', why: 'Tracing HTTP tidak bergantung pada database.' },
            { text: 'Sampling 100% terlalu tinggi.', why: 'Sampling tinggi tidak memisahkan trace.' },
          ],
          explanation: 'Builder yang disediakan auto-configuration Spring Boot sudah diinstrumentasi Micrometer Observation. Klien yang dibuat manual melewati instrumentasi itu.',
        },
        {
          kind: 'fill',
          id: 'traceparent',
          prompt: 'Nama header W3C Trace Context yang membawa trace ID dan span ID antarservice adalah…',
          answers: ['traceparent'],
          placeholder: 'nama-header',
          hint: 'Satu kata, diawali "trace".',
          explanation: 'Contoh: `traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`. Spring Boot memakai propagasi W3C secara default.',
        },
        {
          kind: 'code',
          id: 'sampling',
          prompt: 'Untuk lingkungan development, atur sampling tracing menjadi 100%.',
          language: 'yaml',
          starter: `management:
  tracing:
    # TODO`,
          solution: `management:
  tracing:
    sampling:
      probability: 1.0`,
          checks: [
            { label: 'Ada blok `sampling:`', pattern: r`^\s+sampling\s*:\s*$`, hint: 'Tambahkan `sampling:` di bawah `tracing:`.' },
            { label: '`probability: 1.0`', pattern: r`^\s+probability\s*:\s*(1|1\.0)\s*$`, hint: 'Isi `probability: 1.0`.' },
          ],
          explanation: 'Di produksi, sampling 100% bisa mahal. Pilih proporsi yang cukup untuk analisis, atau gunakan tail-based sampling di collector.',
        },
      ],
    },
    {
      slug: 'liveness-readiness-startup',
      title: 'Liveness, readiness & startup',
      summary: 'Probe memberi tahu platform kapan instance siap menerima traffic dan kapan perlu di-restart. Salah konfigurasi bisa menyebabkan restart massal.',
      minutes: 35,
      objectives: [
        'Membedakan liveness, readiness, dan startup probe.',
        'Mengaktifkan health group probe di Spring Boot.',
        'Menghindari dependency eksternal di liveness.',
      ],
      keyPoints: [
        'Readiness: apakah instance siap menerima traffic? Gagal → dikeluarkan dari load balancing.',
        'Liveness: apakah proses masih sehat? Gagal → container di-restart.',
        'Startup probe memberi waktu aplikasi yang lambat start sebelum liveness diperiksa.',
        'Spring Boot menyediakan `/actuator/health/liveness` dan `/actuator/health/readiness`.',
        'Jangan masukkan database atau service lain ke liveness; kegagalan bersama akan me-restart semua instance.',
      ],
      practice: {
        task: 'Simulasikan aplikasi yang belum siap menerima request (misalnya cache belum dimuat) dengan `AvailabilityChangeEvent`.',
        proof: 'Readiness melaporkan `OUT_OF_SERVICE` sampai siap, sementara liveness tetap `UP`.',
      },
      refs: [
        { source: 'probe', note: 'Konfigurasi probe Kubernetes.' },
        { source: 'actuator', note: 'Health group liveness dan readiness.' },
      ],
      exercises: [
        {
          kind: 'choice',
          id: 'probe-db',
          prompt: 'Database bersama sedang down selama 2 menit. Jika health database dimasukkan ke **liveness** probe semua instance, apa yang terjadi?',
          options: [
            { text: 'Semua instance di-restart berulang kali walau restart tidak memperbaiki database.', correct: true },
            { text: 'Database otomatis pulih.', why: 'Restart aplikasi tidak memperbaiki database.' },
            { text: 'Tidak ada efek.', why: 'Liveness yang gagal memicu restart container.' },
            { text: 'Hanya satu instance yang di-restart.', why: 'Semua instance melihat database yang sama-sama down.' },
          ],
          explanation: 'Kegagalan dependency bersama lebih tepat ditangani readiness (berhenti menerima traffic) atau sama sekali tidak di probe, bukan restart.',
        },
        {
          kind: 'code',
          id: 'k8s-probes',
          prompt: 'Lengkapi probe container: readiness ke `/actuator/health/readiness` dan liveness ke `/actuator/health/liveness`, keduanya di port 8080.',
          language: 'yaml',
          starter: `containers:
  - name: order
    image: registry.example.com/order:0.1
    ports:
      - containerPort: 8080
    # TODO: readinessProbe dan livenessProbe`,
          solution: `containers:
  - name: order
    image: registry.example.com/order:0.1
    ports:
      - containerPort: 8080
    readinessProbe:
      httpGet:
        path: /actuator/health/readiness
        port: 8080
    livenessProbe:
      httpGet:
        path: /actuator/health/liveness
        port: 8080`,
          checks: [
            { label: '`readinessProbe` ke `/actuator/health/readiness`', pattern: r`readinessProbe\s*:\s*\n\s+httpGet\s*:\s*\n\s+path\s*:\s*/actuator/health/readiness`, hint: 'Tambahkan `readinessProbe: httpGet: path: /actuator/health/readiness`.' },
            { label: '`livenessProbe` ke `/actuator/health/liveness`', pattern: r`livenessProbe\s*:\s*\n\s+httpGet\s*:\s*\n\s+path\s*:\s*/actuator/health/liveness`, hint: 'Tambahkan `livenessProbe: httpGet: path: /actuator/health/liveness`.' },
            { label: 'Port 8080 pada probe', pattern: r`httpGet\s*:\s*\n\s+path\s*:[^\n]*\n\s+port\s*:\s*8080`, hint: 'Isi `port: 8080` di bawah `path`.' },
          ],
          explanation: 'Spring Boot mengaktifkan health group probe otomatis saat mendeteksi Kubernetes; di luar Kubernetes aktifkan dengan `management.endpoint.health.probes.enabled=true`.',
        },
      ],
    },
  ],
};

export default observability;
