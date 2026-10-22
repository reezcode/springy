import type { ModuleInput } from '../types.ts';

const r = String.raw;

const testingSecurity: ModuleInput = {
  slug: 'testing-keamanan',
  title: 'Testing & security',
  subtitle: 'Tulis test dan lindungi akses ke API.',
  description:
    'Mulai dengan unit test untuk aturan bisnis, lalu uji akses database memakai Testcontainers. Konfigurasikan API sebagai OAuth 2.0 resource server dengan JWT dan periksa response untuk input tidak valid, token yang salah, serta resource yang tidak ditemukan.',
  category: 'Spring Boot',
  hours: '7–10',
  tint: 'peach',
  icon: 'shield',
  lessons: [
    {
      slug: 'unit-test-bisnis',
      title: 'Unit test aturan bisnis',
      summary: 'Uji service dan domain dengan dependency fake, tanpa memuat Spring. Test harus memberi hasil yang sama setiap kali dijalankan.',
      minutes: 40,
      objectives: [
        'Menulis test JUnit 5 dengan pola Arrange–Act–Assert.',
        'Mengganti dependency dengan fake atau mock.',
        'Menguji exception dengan `assertThrows`.',
      ],
      keyPoints: [
        'Unit test tidak memuat ApplicationContext; buat object dengan `new` dan berikan fake.',
        'Satu test memeriksa satu perilaku yang penting, dinamai sesuai perilaku itu.',
        'Test harus deterministik: tanpa jaringan, waktu nyata, atau urutan acak.',
        'Mock berlebihan menguji implementasi, bukan perilaku; prioritaskan fake sederhana untuk dependency milikmu.',
      ],
      practice: {
        task: 'Tulis test untuk diskon member, penolakan total negatif, dan kegagalan pembayaran.',
        proof: 'Semua test lulus dalam hitungan milidetik dan tidak memanggil jaringan.',
      },
      refs: [
        { source: 'test', note: 'Dukungan testing Spring Boot dan JUnit 5.' },
        { source: 'di', note: 'Constructor injection memudahkan pembuatan object di test.' },
      ],
      exercises: [
        {
          kind: 'code',
          id: 'assert-throws',
          prompt: 'Lengkapi test yang memastikan membuat `Order` dengan total negatif melempar `IllegalArgumentException`.',
          language: 'java',
          starter: `class OrderTest {
  @Test
  void rejectsNegativeTotal() {
    // TODO
  }
}`,
          solution: `class OrderTest {
  @Test
  void rejectsNegativeTotal() {
    assertThrows(IllegalArgumentException.class,
        () -> new Order(new BigDecimal("-1")));
  }
}`,
          checks: [
            { label: 'Memakai `assertThrows(IllegalArgumentException.class, ...)`', pattern: r`assertThrows\s*\(\s*IllegalArgumentException\.class\s*,`, hint: 'Gunakan `assertThrows(IllegalArgumentException.class, () -> ...)`.' },
            { label: 'Lambda membuat `new Order(...)`', pattern: r`\(\s*\)\s*->\s*new\s+Order\s*\(`, hint: 'Argumen kedua: `() -> new Order(new BigDecimal("-1"))`.' },
            { label: 'Memakai nilai negatif', pattern: r`"-\d|BigDecimal\s*\.\s*valueOf\s*\(\s*-\d|\.negate\s*\(`, hint: 'Berikan total negatif, misalnya `new BigDecimal("-1")`.' },
          ],
          explanation: '`assertThrows` gagal jika tidak ada exception atau jenisnya berbeda, dan mengembalikan exception-nya sehingga pesan juga bisa diperiksa.',
        },
        {
          kind: 'order',
          id: 'aaa',
          prompt: 'Susun bagian test berikut sesuai pola Arrange–Act–Assert.',
          items: [
            '`var gateway = new FakeGateway();`',
            '`var checkout = new Checkout(new MemberDiscount(), gateway);`',
            '`checkout.pay(100_000);`',
            '`assertEquals(90_000, gateway.lastAmount);`',
          ],
          explanation: 'Arrange: siapkan fake dan object yang dites. Act: jalankan satu aksi. Assert: periksa hasil yang terlihat dari luar.',
        },
        {
          kind: 'choice',
          id: 'deterministic',
          prompt: 'Service memakai `LocalDate.now()` untuk menentukan promo. Cara terbaik membuat test-nya deterministik adalah…',
          options: [
            { text: 'Inject `java.time.Clock` dan gunakan `Clock.fixed(...)` di test.', correct: true },
            { text: 'Jalankan test hanya pada tanggal promo.', why: 'Test akan gagal di hari lain dan CI menjadi tidak dapat diandalkan.' },
            { text: 'Tambahkan `Thread.sleep` sampai tanggal berganti.', why: 'Lambat dan tetap tidak deterministik.' },
            { text: 'Hapus test-nya.', why: 'Aturan promo tetap perlu dibuktikan.' },
          ],
          explanation: 'Waktu adalah dependency. Dengan `LocalDate.now(clock)` dan `Clock.fixed`, test selalu melihat tanggal yang sama.',
        },
      ],
    },
    {
      slug: 'integration-testcontainers',
      title: 'Integration test dengan database',
      summary: 'Testcontainers menjalankan PostgreSQL sungguhan di container selama test, sehingga SQL, migrasi, dan constraint ikut teruji.',
      minutes: 45,
      objectives: [
        'Menulis `@DataJpaTest` atau `@SpringBootTest` dengan Testcontainers.',
        'Memakai `@ServiceConnection` agar datasource terhubung otomatis.',
        'Memahami trade-off kecepatan dan realisme.',
      ],
      keyPoints: [
        'Integration test membuktikan bagian-bagian bekerja bersama: mapping, query, migrasi, transaksi.',
        'Database in-memory seperti H2 berperilaku berbeda dari PostgreSQL; gunakan database yang sama dengan produksi.',
        '`@ServiceConnection` (Spring Boot 3.1+) mengisi URL, user, dan password dari container otomatis.',
        'Test membutuhkan runtime container (Docker atau Podman) yang kompatibel.',
      ],
      practice: {
        task: 'Uji repository dan migrasi Flyway terhadap PostgreSQL dalam container sementara.',
        proof: 'Test memakai SQL nyata, lulus di CI, dan container dibersihkan setelahnya.',
      },
      refs: [{ source: 'tc', note: 'Integrasi Testcontainers dan @ServiceConnection.' }],
      exercises: [
        {
          kind: 'code',
          id: 'service-connection',
          prompt: 'Lengkapi deklarasi container PostgreSQL agar Spring Boot memakainya sebagai datasource test secara otomatis.',
          language: 'java',
          starter: `@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryTest {
  // TODO: container postgres:16
}`,
          solution: `@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryTest {
  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
}`,
          checks: [
            { label: 'Annotation `@Container`', pattern: r`@Container\b`, hint: 'Tambahkan `@Container` agar Testcontainers mengelola siklus hidupnya.' },
            { label: 'Annotation `@ServiceConnection`', pattern: r`@ServiceConnection\b`, hint: 'Tambahkan `@ServiceConnection` agar datasource diisi otomatis.' },
            { label: 'Field `static PostgreSQLContainer`', pattern: r`static\s+(final\s+)?PostgreSQLContainer\s*<\s*\??\s*>\s+\w+`, hint: 'Deklarasikan `static PostgreSQLContainer<?> postgres = ...`. Static agar dipakai bersama semua test di class.' },
            { label: 'Image `postgres:16`', pattern: r`new\s+PostgreSQLContainer\s*<\s*>\s*\(\s*"postgres:16`, hint: 'Gunakan `new PostgreSQLContainer<>("postgres:16")`.' },
          ],
          explanation: '`Replace.NONE` mencegah `@DataJpaTest` mengganti datasource dengan database embedded, sehingga container PostgreSQL yang dipakai.',
        },
        {
          kind: 'choice',
          id: 'why-not-h2',
          prompt: 'Mengapa integration test sebaiknya memakai PostgreSQL (lewat Testcontainers) dan bukan H2 in-memory, jika produksi memakai PostgreSQL?',
          options: [
            { text: 'Dialek SQL, tipe data, dan constraint berbeda; test bisa lulus di H2 tetapi gagal di produksi.', correct: true },
            { text: 'H2 tidak bisa menjalankan query SELECT.', why: 'H2 bisa, tetapi perilakunya tidak identik dengan PostgreSQL.' },
            { text: 'Testcontainers selalu lebih cepat dari H2.', why: 'Biasanya justru sedikit lebih lambat; yang didapat adalah realisme.' },
            { text: 'Spring Boot tidak mendukung H2.', why: 'Spring Boot mendukung H2.' },
          ],
          explanation: 'Fitur seperti `jsonb`, `generated always as identity`, atau sintaks migrasi Flyway khusus PostgreSQL hanya bisa diuji dengan PostgreSQL.',
        },
      ],
    },
    {
      slug: 'auth-jwt-resource-server',
      title: 'Authentication, authorization & JWT',
      summary: 'API berperan sebagai resource server: memvalidasi token dari authorization server dan memutuskan akses berdasarkan scope.',
      minutes: 45,
      objectives: [
        'Membedakan authentication (siapa) dan authorization (boleh apa).',
        'Mengonfigurasi Spring Security sebagai OAuth 2.0 resource server JWT.',
        'Membatasi endpoint berdasarkan scope.',
      ],
      keyPoints: [
        'Authentication membuktikan identitas; authorization memutuskan izin.',
        'Resource server memverifikasi signature, issuer, masa berlaku, dan audience token.',
        'Scope di JWT dipetakan menjadi authority `SCOPE_xxx`.',
        'Tanpa token atau token tidak valid → 401; token valid tapi izin kurang → 403.',
        'Jangan menulis verifier JWT sendiri; decode Base64 bukan verifikasi.',
      ],
      practice: {
        task: 'Lindungi `POST /orders` dengan scope `orders:write` dan `GET /orders/**` dengan `orders:read`.',
        proof: 'Tanpa token 401; token dengan scope kurang 403; token dengan scope tepat berhasil.',
      },
      refs: [{ source: 'security', note: 'Konfigurasi resource server JWT dan pemetaan authority.' }],
      exercises: [
        {
          kind: 'choice',
          id: '401-vs-403',
          prompt: 'Klien mengirim token valid dengan scope `orders:read` ke `POST /orders` yang membutuhkan `orders:write`. Status yang tepat adalah…',
          options: [
            { text: '403 Forbidden', correct: true },
            { text: '401 Unauthorized', why: '401 untuk token tidak ada/tidak valid. Di sini identitas sudah terbukti.' },
            { text: '404 Not Found', why: 'Endpoint ada; masalahnya izin.' },
            { text: '400 Bad Request', why: 'Request-nya valid secara format.' },
          ],
          explanation: '401: "saya tidak tahu siapa kamu". 403: "saya tahu siapa kamu, tetapi kamu tidak boleh melakukan ini".',
        },
        {
          kind: 'code',
          id: 'security-chain',
          prompt: 'Lengkapi `SecurityFilterChain`: `POST /orders` butuh authority `SCOPE_orders:write`, request lain wajib terautentikasi, dan aktifkan resource server JWT.',
          language: 'java',
          starter: `@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
  http.authorizeHttpRequests(auth -> auth
      .anyRequest().permitAll());
  return http.build();
}`,
          solution: `@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
  http.authorizeHttpRequests(auth -> auth
          .requestMatchers(HttpMethod.POST, "/orders").hasAuthority("SCOPE_orders:write")
          .anyRequest().authenticated())
      .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));
  return http.build();
}`,
          checks: [
            { label: '`POST /orders` membutuhkan `SCOPE_orders:write`', pattern: r`requestMatchers\s*\(\s*HttpMethod\s*\.\s*POST\s*,\s*"/orders"\s*\)\s*\.\s*hasAuthority\s*\(\s*"SCOPE_orders:write"\s*\)`, hint: 'Tulis `.requestMatchers(HttpMethod.POST, "/orders").hasAuthority("SCOPE_orders:write")`.' },
            { label: 'Request lain `.anyRequest().authenticated()`', pattern: r`anyRequest\s*\(\s*\)\s*\.\s*authenticated\s*\(\s*\)`, hint: 'Ganti `permitAll()` menjadi `authenticated()`.' },
            { label: 'Tidak ada `anyRequest().permitAll()`', pattern: r`anyRequest\s*\(\s*\)\s*\.\s*permitAll`, absent: true, hint: 'Default-nya tolak; buka hanya endpoint yang memang publik.' },
            { label: 'Mengaktifkan `oauth2ResourceServer(... jwt ...)`', pattern: r`oauth2ResourceServer\s*\([\s\S]*jwt\s*\(`, hint: 'Tambahkan `.oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))`.' },
          ],
          explanation: 'Aturan dibaca dari atas ke bawah; aturan spesifik dulu, `anyRequest()` terakhir. Issuer diatur di `spring.security.oauth2.resourceserver.jwt.issuer-uri`.',
        },
        {
          kind: 'choice',
          id: 'decode-not-verify',
          prompt: 'Sebuah filter mengambil JWT, men-decode payload Base64, lalu membaca `sub` untuk menentukan pengguna. Apa masalahnya?',
          options: [
            { text: 'Signature tidak diverifikasi, jadi siapa pun bisa membuat token palsu dengan `sub` apa saja.', correct: true },
            { text: 'Tidak ada masalah, payload JWT memang Base64.', why: 'Payload memang Base64, tetapi tanpa verifikasi signature isinya tidak bisa dipercaya.' },
            { text: 'Base64 terlalu lambat.', why: 'Masalahnya keamanan, bukan performa.' },
            { text: 'Seharusnya memakai Base32.', why: 'Encoding tidak relevan; yang penting verifikasi kriptografis.' },
          ],
          explanation: 'Base64 hanyalah encoding, bukan enkripsi atau tanda tangan. Gunakan resource server Spring Security yang memverifikasi signature dengan kunci publik dari issuer (JWKS).',
        },
      ],
    },
    {
      slug: 'test-jalur-gagal',
      title: 'Test untuk skenario gagal',
      summary: 'Uji response 400, 401, 403, dan 404 agar perubahan kode tidak mengubah validasi atau aturan akses tanpa disadari.',
      minutes: 40,
      objectives: [
        'Menulis test HTTP dengan MockMvc dan `@WebMvcTest`.',
        'Mensimulasikan JWT di test dengan `jwt()` post-processor.',
        'Memastikan build gagal ketika kontrak error berubah.',
      ],
      keyPoints: [
        '`@WebMvcTest` memuat web layer saja; service di-mock dengan `@MockitoBean`.',
        '`SecurityMockMvcRequestPostProcessors.jwt()` membuat request terautentikasi tanpa authorization server sungguhan.',
        'Periksa status, Content-Type, dan field penting body error.',
        'Coverage tinggi tanpa skenario gagal memberi rasa aman palsu.',
      ],
      practice: {
        task: 'Tambahkan test untuk 400, 404, 401, dan 403 pada endpoint order.',
        proof: 'Mengubah salah satu status di kode membuat build gagal.',
      },
      refs: [
        { source: 'test', note: 'Slice test seperti @WebMvcTest.' },
        { source: 'security', note: 'Testing resource server JWT.' },
      ],
      exercises: [
        {
          kind: 'code',
          id: 'mockmvc-401',
          prompt: 'Lengkapi test MockMvc: `GET /orders/1` tanpa token harus mengembalikan 401.',
          language: 'java',
          starter: `@Test
void rejectsAnonymous() throws Exception {
  // TODO
}`,
          solution: `@Test
void rejectsAnonymous() throws Exception {
  mvc.perform(get("/orders/1"))
      .andExpect(status().isUnauthorized());
}`,
          checks: [
            { label: 'Memanggil `mvc.perform(get("/orders/1"))`', pattern: r`\.\s*perform\s*\(\s*get\s*\(\s*"/orders/1"\s*\)\s*\)`, hint: 'Gunakan `mvc.perform(get("/orders/1"))` tanpa `.with(jwt())`.' },
            { label: 'Mengharapkan `status().isUnauthorized()`', pattern: r`andExpect\s*\(\s*status\s*\(\s*\)\s*\.\s*(isUnauthorized\s*\(\s*\)|is\s*\(\s*401\s*\))`, hint: 'Tambahkan `.andExpect(status().isUnauthorized())`.' },
            { label: 'Tidak menyertakan token', pattern: r`with\s*\(\s*jwt`, absent: true, hint: 'Test ini justru memeriksa request tanpa token.' },
          ],
          explanation: 'Test serupa dengan `.with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_orders:read")))` membuktikan jalur 200 dan 403.',
        },
        {
          kind: 'choice',
          id: 'coverage-trap',
          prompt: 'Coverage proyek 95%, tetapi tidak ada test untuk 400/401/403/404. Apa risikonya?',
          options: [
            { text: 'Perubahan konfigurasi keamanan atau pemetaan error bisa lolos tanpa terdeteksi.', correct: true },
            { text: 'Tidak ada risiko; 95% sudah cukup.', why: 'Coverage mengukur baris yang dijalankan, bukan perilaku yang dibuktikan.' },
            { text: 'Build akan lebih lambat.', why: 'Masalahnya kualitas perlindungan, bukan kecepatan.' },
            { text: 'Spring akan menolak start.', why: 'Aplikasi tetap start; bug baru terlihat oleh klien.' },
          ],
          explanation: 'Skenario gagal adalah bagian kontrak. Test untuk setiap status penting menjaga perilaku itu tetap stabil.',
        },
      ],
    },
  ],
};

export default testingSecurity;
