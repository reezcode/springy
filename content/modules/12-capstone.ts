import type { ModuleInput } from '../types.ts';

const capstone: ModuleInput = {
  slug: 'capstone',
  title: 'Capstone: Mini Commerce',
  subtitle: 'Buat Mini Commerce dari desain sampai deploy.',
  description:
    'Bangun Order, Inventory, dan Notification dengan konsep dari modul sebelumnya. Tulis kontraknya, uji skenario gagal, buat container image, lalu lengkapi README agar orang lain bisa menjalankan dan menguji project-mu.',
  category: 'Proyek akhir',
  hours: '10–16',
  tint: 'lavender',
  icon: 'rocket',
  lessons: [
    {
      slug: 'rancang-dokumentasi',
      title: 'Rancang & dokumentasikan',
      summary: 'Sebelum menulis kode, tetapkan service boundary, kontrak API dan event, serta data ownership. Dokumen ini akan menjadi acuan saat implementasi dan review.',
      minutes: 60,
      objectives: [
        'Menyusun diagram konteks dan alur utama Mini Commerce.',
        'Menulis kontrak API dan schema event.',
        'Mencatat keputusan arsitektur dalam ADR.',
      ],
      keyPoints: [
        'Mulai kecil: Order, Inventory, dan satu worker Notification sudah cukup.',
        'Setiap data punya satu pemilik; tulis siapa yang boleh membaca dan menulis.',
        'Kontrak mencakup skenario gagal, bukan hanya happy path.',
        'ADR mencatat konteks dan konsekuensi, bukan hanya keputusan.',
      ],
      practice: {
        task: 'Tulis diagram alur pembuatan order, kontrak `POST /orders` dan `POST /reservations`, schema event `OrderConfirmed`, dan tabel ownership data.',
        proof: 'Orang lain dapat menjelaskan alur dan kegagalannya hanya dari dokumen, tanpa membaca kode.',
      },
      refs: [
        { source: 'micro', note: 'Karakteristik dan batas microservices.' },
        { source: 'saga', note: 'Desain alur lintas service.' },
      ],
      exercises: [
        {
          kind: 'choice',
          id: 'scope',
          prompt: 'Mana cakupan capstone yang paling realistis untuk membuktikan pemahaman?',
          options: [
            { text: 'Order dan Inventory sebagai service HTTP, Notification sebagai consumer event, satu alur end-to-end dengan skenario gagal.', correct: true },
            { text: 'Sepuluh service termasuk katalog, rekomendasi, dan analitik.', why: 'Lebar tanpa kedalaman; skenario gagal tidak sempat dibuktikan.' },
            { text: 'Satu service CRUD tanpa komunikasi antarservice.', why: 'Tidak menguji konsep microservices dan resilience.' },
            { text: 'Hanya diagram tanpa kode.', why: 'Capstone menuntut bukti yang berjalan.' },
          ],
          explanation: 'Mulai dengan satu alur end-to-end yang mencakup skenario berhasil dan gagal. Cakupan ini memberi waktu untuk menguji komunikasi antarservice, retry, dan pengiriman event.',
        },
        {
          kind: 'order',
          id: 'design-order',
          prompt: 'Urutkan aktivitas desain sebelum menulis kode.',
          items: [
            'Tulis alur bisnis utama dari sudut pandang pengguna.',
            'Tentukan service boundary dan pemilik setiap data.',
            'Tulis kontrak API dan event, termasuk skenario gagal.',
            'Catat keputusan dan trade-off dalam ADR.',
          ],
          explanation: 'Alur bisnis memandu batas, batas menentukan kontrak, dan ADR merekam alasan di balik semuanya.',
        },
      ],
    },
    {
      slug: 'bangun-uji-kegagalan',
      title: 'Bangun & uji kegagalan',
      summary: 'Hubungkan database dan service, atur akses API, lalu uji timeout, retry, dan pengiriman event duplikat.',
      minutes: 120,
      objectives: [
        'Mengimplementasikan alur order lintas service dengan timeout dan idempotency.',
        'Membuktikan perilaku saat Inventory mati dan saat pesan dikirim ulang.',
        'Mengotomatiskan skenario kegagalan dalam test.',
      ],
      keyPoints: [
        'Setiap skenario gagal yang didokumentasikan perlu bukti: test otomatis atau catatan percobaan yang bisa diulang.',
        'Matikan Inventory: Order harus merespons dalam batas timeout dengan error yang jelas.',
        'Kirim ulang event: Notification tidak boleh mengirim dua kali.',
        'Gagalkan langkah kedua transaksi lokal: tidak ada data setengah jadi.',
        'Simulasi browser membantu memahami konsep, tetapi bukti capstone harus berasal dari aplikasi nyata.',
      ],
      practice: {
        task: 'Buktikan empat skenario: timeout Inventory, retry dengan idempotency key, deduplikasi consumer, dan rollback transaksi lokal.',
        proof: 'Ada test atau log percobaan untuk setiap skenario beserta hasil yang diharapkan dan yang terjadi.',
      },
      refs: [
        { source: 'tc', note: 'Integration test dengan dependency nyata.' },
        { source: 'mq', note: 'Redelivery dan acknowledgement.' },
        { source: 'cb', note: 'Perilaku saat dependency gagal.' },
      ],
      exercises: [
        {
          kind: 'choice',
          id: 'proof-quality',
          prompt: 'Bukti mana yang paling meyakinkan bahwa consumer Notification idempotent?',
          options: [
            { text: 'Integration test yang mengirim event dengan ID sama dua kali lalu memeriksa hanya satu notifikasi tercatat.', correct: true },
            { text: 'Komentar di kode yang menyatakan consumer idempotent.', why: 'Komentar tidak membuktikan perilaku.' },
            { text: 'Screenshot satu kali pengiriman yang berhasil.', why: 'Tidak menguji kasus duplikat sama sekali.' },
            { text: 'Coverage 90% pada class consumer.', why: 'Coverage tidak membuktikan skenario duplikat diuji.' },
          ],
          explanation: 'Bukti terbaik bisa diulang otomatis dan langsung menguji skenario yang diklaim.',
        },
        {
          kind: 'choice',
          id: 'failure-matrix',
          prompt: 'Saat Inventory dimatikan, perilaku Order yang diharapkan (sesuai desain modul sebelumnya) adalah…',
          multiple: true,
          options: [
            { text: 'Request selesai dalam batas timeout, tidak menggantung.', correct: true },
            { text: 'Klien menerima error yang jelas, misalnya 503 dengan ProblemDetail.', correct: true },
            { text: 'Order dianggap sukses dan stok diasumsikan tersedia.', why: 'Fallback tidak boleh berpura-pura sukses untuk operasi penting.' },
            { text: 'Thread Order menunggu sampai Inventory hidup kembali.', why: 'Inilah yang dicegah oleh timeout dan circuit breaker.' },
          ],
          explanation: 'Kembalikan error segera setelah batas timeout tercapai. Saat circuit breaker berstatus OPEN, request ditolak tanpa memanggil Inventory.',
        },
      ],
    },
    {
      slug: 'build-release-deploy',
      title: 'Build, release & deploy',
      summary: 'Uji dulu, bangun image sekali, beri tag yang jelas, dan jalankan image yang sama di setiap lingkungan dengan konfigurasi berbeda.',
      minutes: 90,
      objectives: [
        'Menyusun pipeline: test → build image → push → deploy.',
        'Menerapkan prinsip build once, deploy many.',
        'Menulis langkah rollout dan rollback.',
      ],
      keyPoints: [
        'Test berjalan sebelum image dibangun; image yang gagal test tidak boleh dirilis.',
        'Tag rilis yang jelas (versi atau commit SHA), bukan `latest`.',
        'Masukkan konfigurasi dan secret saat deploy melalui environment variable atau fasilitas platform.',
        'Rollback aplikasi tidak otomatis membalik migrasi database.',
      ],
      practice: {
        task: 'Deploy image yang sama ke dua lingkungan (misalnya Compose lokal dan sandbox OpenShift) dengan konfigurasi berbeda.',
        proof: 'Ada langkah rollout, verifikasi kesehatan, dan rollback ke versi sebelumnya yang sudah dicoba.',
      },
      refs: [
        { source: 'image', note: 'Tag, digest, dan registry.' },
        { source: 'deployment', note: 'Rollout dan rollback Deployment.' },
        { source: 'config', note: 'Konfigurasi eksternal per lingkungan.' },
      ],
      exercises: [
        {
          kind: 'order',
          id: 'pipeline',
          prompt: 'Urutkan tahapan pipeline rilis yang aman.',
          items: [
            'Jalankan unit dan integration test (`./mvnw verify`).',
            'Bangun image dan beri tag versi/commit.',
            'Push image ke registry.',
            'Deploy ke lingkungan staging dengan konfigurasi staging.',
            'Verifikasi health dan smoke test.',
            'Deploy image yang sama ke produksi.',
          ],
          explanation: 'Image dibangun sekali setelah test lulus, lalu dipromosikan antarlingkungan tanpa dibangun ulang.',
        },
        {
          kind: 'choice',
          id: 'config-in-image',
          prompt: 'Tim ingin password database produksi tersedia di aplikasi. Cara yang tepat adalah…',
          options: [
            { text: 'Inject dari Secret platform sebagai environment variable saat deploy.', correct: true },
            { text: 'Tulis di `application-prod.yml` di dalam image.', why: 'Secret ikut tersebar ke semua yang bisa menarik image dan masuk riwayat Git.' },
            { text: 'Bangun image terpisah khusus produksi yang berisi password.', why: 'Melanggar build once, deploy many, dan tetap menyimpan secret di image.' },
            { text: 'Kirim lewat argumen build `--build-arg`.', why: 'Build arg bisa terlihat di riwayat image.' },
          ],
          explanation: 'Image harus sama di semua lingkungan dan bebas secret. Perbedaan lingkungan masuk lewat ConfigMap, Secret, atau environment variable.',
        },
      ],
    },
    {
      slug: 'review-serah-terima',
      title: 'Review & serah terima',
      summary: 'Proyek selesai ketika orang lain bisa menjalankan, menguji, mengamati, dan memulihkannya dari awal hanya dengan mengikuti dokumentasi.',
      minutes: 60,
      objectives: [
        'Menulis README yang bisa diikuti dari lingkungan bersih.',
        'Mencatat keterbatasan dan risiko yang diketahui.',
        'Melakukan review dengan checklist definition of done.',
      ],
      keyPoints: [
        'README menjawab: cara run, test, deploy, mengamati, dan memulihkan.',
        'Catat keterbatasan yang diketahui, dampaknya, dan rencana penanganannya.',
        'Uji README di lingkungan bersih oleh orang lain.',
        'Checklist selesai berarti ada bukti praktik, bukan hanya sudah membaca.',
      ],
      practice: {
        task: 'Minta orang lain menjalankan README di mesin bersih, catat setiap kendala, dan perbaiki dokumentasinya.',
        proof: 'Run, test, observasi error, dan deploy bisa diulang tanpa bantuanmu.',
      },
      refs: [
        { source: 'maven', note: 'Perintah build standar untuk README.' },
        { source: 'actuator', note: 'Endpoint health dan info untuk verifikasi.' },
      ],
      exercises: [
        {
          kind: 'choice',
          id: 'readme',
          prompt: 'Bagian mana yang **wajib** ada di README capstone?',
          multiple: true,
          options: [
            { text: 'Prasyarat dan perintah menjalankan semua service secara lokal.', correct: true },
            { text: 'Cara menjalankan test dan skenario kegagalan.', correct: true },
            { text: 'Cara memeriksa health, log, dan trace saat ada masalah.', correct: true },
            { text: 'Riwayat lengkap semua commit.', why: 'Riwayat sudah ada di Git; README fokus pada cara menggunakan dan memelihara.' },
          ],
          explanation: 'README yang baik membuat proyek bisa dioperasikan oleh orang lain, termasuk dirimu sendiri beberapa bulan lagi.',
        },
        {
          kind: 'choice',
          id: 'limitations',
          prompt: 'Outbox relay di capstone-mu belum mendukung banyak replica. Apa yang sebaiknya dilakukan saat serah terima?',
          options: [
            { text: 'Catat sebagai keterbatasan yang diketahui beserta dampak dan rencana perbaikannya.', correct: true },
            { text: 'Sembunyikan agar proyek terlihat lengkap.', why: 'Keterbatasan tersembunyi akan ditemukan di produksi pada saat terburuk.' },
            { text: 'Hapus fitur outbox.', why: 'Menghapus solusi tidak menghilangkan masalah dual write.' },
            { text: 'Anggap tidak penting karena hanya latihan.', why: 'Keterbatasan tetap perlu dicatat agar orang yang mencoba project tahu kondisi yang belum didukung.' },
          ],
          explanation: 'Dokumentasi membantu tim mengetahui kondisi yang belum didukung dan menyiapkan penanganannya.',
        },
      ],
    },
  ],
};

export default capstone;
