import type { ModuleInput } from '../types.ts';

const r = String.raw;

const restApi: ModuleInput = {
  slug: 'rest-api',
  title: 'REST API yang rapi',
  subtitle: 'Buat API dengan request dan response yang jelas.',
  description:
    'Rancang resource dan HTTP status code, validasi input dengan DTO dan Bean Validation, lalu susun error response memakai ProblemDetail. Lengkapi kontrak API dengan contoh request, response, dan edge cases.',
  category: 'Spring Boot',
  hours: '6–8',
  tint: 'blue',
  icon: 'braces',
  lessons: [
    {
      slug: 'resource-http-status',
      title: 'Resource, HTTP method & status',
      summary: 'Rancang URL sebagai resource, pilih method sesuai semantiknya, dan kembalikan status code sesuai hasil operasinya.',
      minutes: 40,
      objectives: [
        'Merancang URL berbasis resource (`/orders`, `/orders/{id}`).',
        'Memilih HTTP method berdasarkan sifat safe dan idempotent.',
        'Mengembalikan `201 Created` dengan header `Location`.',
      ],
      keyPoints: [
        'URL menamai resource (kata benda); HTTP method menyatakan aksi.',
        'GET bersifat *safe* (tidak mengubah state); GET, PUT, DELETE bersifat *idempotent*; POST tidak.',
        '201 untuk resource baru (dengan `Location`), 200 untuk sukses dengan body, 204 tanpa body.',
        '4xx berarti kesalahan klien; 5xx berarti kesalahan server.',
      ],
      practice: {
        task: 'Implementasikan `POST /orders` (201 + Location) dan `GET /orders/{id}` (200 atau 404) dengan penyimpanan in-memory.',
        proof: 'Kontrak request/response dan kondisi gagal terdokumentasi di README dengan contoh curl.',
      },
      refs: [{ source: 'rest', note: 'Panduan dasar REST controller.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'status-create',
          prompt: '`POST /orders` berhasil membuat order baru dengan ID 42. Response yang paling tepat adalah…',
          options: [
            { text: '`201 Created` dengan header `Location: /orders/42` dan body order.', correct: true },
            { text: '`200 OK` dengan body `"success"`.', why: '200 bisa dipakai, tetapi 201 + Location lebih informatif untuk pembuatan resource.' },
            { text: '`204 No Content`.', why: '204 berarti tanpa body; klien kehilangan informasi order yang dibuat.' },
            { text: '`302 Found` ke `/orders/42`.', why: 'Redirect bukan semantik pembuatan resource di API.' },
          ],
          explanation: '201 menandakan resource baru dibuat, dan `Location` memberi tahu klien alamatnya.',
        },
        {
          kind: 'choice',
          id: 'idempotent-methods',
          prompt: 'Method mana yang **idempotent** menurut spesifikasi HTTP?',
          multiple: true,
          options: [
            { text: 'GET', correct: true },
            { text: 'PUT', correct: true },
            { text: 'DELETE', correct: true },
            { text: 'POST', why: 'Mengirim POST dua kali bisa membuat dua resource.' },
          ],
          explanation: 'Idempotent berarti mengulang request yang sama menghasilkan state server yang sama seperti sekali kirim. POST tidak, karena itu butuh idempotency key (modul 8).',
        },
        {
          kind: 'code',
          id: 'created-location',
          prompt: 'Lengkapi method agar mengembalikan `201 Created` dengan header Location `/orders/{id}` dan body order.',
          language: 'java',
          starter: `@PostMapping("/orders")
ResponseEntity<OrderResponse> create(@RequestBody CreateOrderRequest request) {
  OrderResponse order = service.create(request);
  return ResponseEntity.ok(order);
}`,
          solution: `@PostMapping("/orders")
ResponseEntity<OrderResponse> create(@RequestBody CreateOrderRequest request) {
  OrderResponse order = service.create(request);
  return ResponseEntity
      .created(URI.create("/orders/" + order.id()))
      .body(order);
}`,
          checks: [
            { label: 'Memakai `ResponseEntity.created(...)`', pattern: r`ResponseEntity\s*\.\s*created\s*\(`, hint: '`ResponseEntity.created(uri)` menghasilkan status 201 dan header Location.' },
            { label: 'URI dibentuk dari ID order', pattern: r`"/orders/"\s*\+\s*order\s*\.\s*id\s*\(\s*\)|\.\s*buildAndExpand\s*\(\s*order\s*\.\s*id\s*\(\s*\)`, hint: 'Contoh: `URI.create("/orders/" + order.id())`.' },
            { label: 'Body berisi order', pattern: r`\.\s*body\s*\(\s*order\s*\)`, hint: 'Tambahkan `.body(order)`.' },
            { label: 'Tidak lagi `ResponseEntity.ok`', pattern: r`ResponseEntity\s*\.\s*ok\s*\(`, absent: true, hint: 'Ganti `ok(...)` dengan `created(...)`.' },
          ],
          explanation: 'Untuk URL absolut, `ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(id).toUri()` juga bisa dipakai.',
        },
      ],
    },
    {
      slug: 'dto-bean-validation',
      title: 'DTO & Bean Validation',
      summary: 'DTO membatasi bentuk input dan output API. `@Valid` memicu validasi body sebelum masuk ke service.',
      minutes: 40,
      objectives: [
        'Memisahkan DTO request/response dari entity.',
        'Memberi constraint dengan `@NotBlank`, `@Min`, `@Size`, dan sejenisnya.',
        'Mengaktifkan validasi dengan `@Valid` pada `@RequestBody`.',
      ],
      keyPoints: [
        'DTO adalah kontrak publik; entity adalah detail penyimpanan. Jangan ekspos entity langsung.',
        'Record cocok untuk DTO karena immutable dan ringkas.',
        'Tanpa `@Valid`, annotation constraint pada DTO tidak diperiksa.',
        'Validasi format (field wajib, rentang angka) berbeda dari validasi aturan bisnis (stok cukup).',
      ],
      practice: {
        task: 'Tolak `product` kosong dan `quantity` kurang dari satu pada `POST /orders`.',
        proof: 'Request tidak valid mendapat 400 dengan informasi field yang salah; service tidak pernah dipanggil.',
      },
      refs: [{ source: 'validation', note: 'Validasi @RequestBody dan method validation.' }],
      exercises: [
        {
          kind: 'code',
          id: 'validated-dto',
          prompt: 'Tambahkan constraint: `product` tidak boleh kosong/blank dan `quantity` minimal 1. Lalu aktifkan validasi di controller.',
          language: 'java',
          starter: `public record CreateOrderRequest(
    String product,
    int quantity) {}

@PostMapping("/orders")
ResponseEntity<OrderResponse> create(@RequestBody CreateOrderRequest request) {
  // ...
}`,
          solution: `public record CreateOrderRequest(
    @NotBlank String product,
    @Min(1) int quantity) {}

@PostMapping("/orders")
ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
  // ...
}`,
          checks: [
            { label: '`@NotBlank` pada `product`', pattern: r`@NotBlank(\s*\([^)]*\))?\s+String\s+product`, hint: 'Tulis `@NotBlank String product`.' },
            { label: '`@Min(1)` (atau `@Positive`) pada `quantity`', pattern: r`(@Min\s*\(\s*(value\s*=\s*)?1\s*\)|@Positive)\s+int\s+quantity`, hint: 'Tulis `@Min(1) int quantity`.' },
            { label: '`@Valid` pada parameter `@RequestBody`', pattern: r`@Valid\s+@RequestBody|@RequestBody\s+@Valid`, hint: 'Tambahkan `@Valid` sebelum `@RequestBody`.' },
          ],
          explanation: 'Jika validasi gagal, Spring melempar `MethodArgumentNotValidException` dan mengembalikan 400 sebelum service dipanggil.',
        },
        {
          kind: 'choice',
          id: 'business-vs-format',
          prompt: 'Manakah yang termasuk **aturan bisnis**, bukan validasi format DTO?',
          options: [
            { text: 'Quantity tidak boleh melebihi stok yang tersedia di Inventory.', correct: true },
            { text: '`product` wajib diisi.', why: 'Ini validasi format yang bisa diperiksa dari request saja.' },
            { text: '`quantity` minimal 1.', why: 'Rentang nilai sederhana bisa diperiksa dengan `@Min`.' },
            { text: 'Email harus berformat valid.', why: '`@Email` adalah constraint format.' },
          ],
          explanation: 'Aturan yang butuh data lain (stok, saldo, status) diperiksa di service dan biasanya menghasilkan 409 atau 422, bukan 400 dari Bean Validation.',
        },
      ],
    },
    {
      slug: 'error-response-problemdetail',
      title: 'Error response & ProblemDetail',
      summary: 'Error yang terstruktur dan konsisten memudahkan klien. Spring mendukung format RFC 9457 lewat `ProblemDetail`.',
      minutes: 35,
      objectives: [
        'Memetakan exception domain ke status HTTP dengan `@RestControllerAdvice`.',
        'Membentuk body error dengan `ProblemDetail`.',
        'Menjaga agar error tidak membocorkan detail internal.',
      ],
      keyPoints: [
        '`@RestControllerAdvice` + `@ExceptionHandler` memusatkan pemetaan exception ke response.',
        '`ProblemDetail` memiliki field standar: `type`, `title`, `status`, `detail`, `instance`.',
        '`spring.mvc.problemdetails.enabled=true` membuat error bawaan Spring MVC memakai format yang sama.',
        'Jangan kirim stack trace, SQL, atau nama class internal ke klien; log di server.',
      ],
      practice: {
        task: 'Petakan `OrderNotFoundException` menjadi 404 dengan body ProblemDetail.',
        proof: 'Body error memiliki `status`, `title`, dan `detail` yang aman dibaca klien.',
      },
      refs: [{ source: 'errors', note: 'ProblemDetail, ErrorResponse, dan ResponseEntityExceptionHandler.' }],
      exercises: [
        {
          kind: 'code',
          id: 'not-found-handler',
          prompt: 'Tulis handler di advice yang memetakan `OrderNotFoundException` ke ProblemDetail status 404 dengan detail dari pesan exception.',
          language: 'java',
          starter: `@RestControllerAdvice
class ApiExceptionHandler {
  // TODO: handler untuk OrderNotFoundException
}`,
          solution: `@RestControllerAdvice
class ApiExceptionHandler {
  @ExceptionHandler(OrderNotFoundException.class)
  ProblemDetail handleNotFound(OrderNotFoundException ex) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    problem.setTitle("Order tidak ditemukan");
    return problem;
  }
}`,
          checks: [
            { label: '`@ExceptionHandler(OrderNotFoundException.class)`', pattern: r`@ExceptionHandler\s*\(\s*(value\s*=\s*)?\{?\s*OrderNotFoundException\.class`, hint: 'Annotation method dengan `@ExceptionHandler(OrderNotFoundException.class)`.' },
            { label: 'Mengembalikan `ProblemDetail`', pattern: r`ProblemDetail\s+\w+\s*\(\s*OrderNotFoundException`, hint: 'Signature: `ProblemDetail handleNotFound(OrderNotFoundException ex)`.' },
            { label: 'Status 404', pattern: r`HttpStatus\s*\.\s*NOT_FOUND|forStatus(AndDetail)?\s*\(\s*404`, hint: 'Gunakan `HttpStatus.NOT_FOUND`.' },
            { label: 'Detail diambil dari exception', pattern: r`ex\s*\.\s*getMessage\s*\(\s*\)|setDetail\s*\(`, hint: 'Isi detail dengan `ex.getMessage()`.' },
          ],
          explanation: 'Klien kini mendapat body seperti `{"type":"about:blank","title":"Order tidak ditemukan","status":404,"detail":"Order 42 tidak ditemukan"}` dengan Content-Type `application/problem+json`.',
        },
        {
          kind: 'choice',
          id: 'leak',
          prompt: 'Body error mana yang **paling aman** dikirim ke klien untuk kegagalan database?',
          options: [
            { text: '`{"status":500,"title":"Internal Server Error","detail":"Terjadi kesalahan. Kode referensi: 7f3a"}`', correct: true },
            { text: 'Stack trace lengkap agar klien bisa membantu debug.', why: 'Stack trace membocorkan struktur internal dan versi library.' },
            { text: '`{"detail":"ERROR: duplicate key violates constraint orders_pkey (id)=(42)"}`', why: 'Pesan SQL membocorkan schema database.' },
            { text: 'Response kosong dengan status 200.', why: 'Status 200 untuk kegagalan menyesatkan klien.' },
          ],
          explanation: 'Log detail lengkap di server dan kirim correlation ID ke klien. Tim bisa mencari log dengan ID itu tanpa membocorkan detail internal.',
        },
      ],
    },
    {
      slug: 'api-contract-edge-cases',
      title: 'API contract & edge cases',
      summary: 'Tulis contoh payload, status code, dan error response agar pemakai API tahu apa yang harus ditangani.',
      minutes: 35,
      objectives: [
        'Mendaftar edge cases: ID tidak ada, JSON rusak, body tidak valid.',
        'Menulis contoh curl dan hasil yang diharapkan.',
        'Memahami perubahan yang merusak kompatibilitas klien.',
      ],
      keyPoints: [
        'Kontrak mencakup status code, bentuk body sukses, bentuk body error, dan header penting.',
        'JSON rusak menghasilkan 400 dari `HttpMessageNotReadableException`, bukan 500.',
        'Mengganti nama atau menghapus field adalah *breaking change*; menambah field opsional umumnya aman.',
        'Versi API atau masa transisi dibutuhkan saat perubahan breaking tidak bisa dihindari.',
      ],
      practice: {
        task: 'Buat koleksi curl untuk 201, 400 (body tidak valid), 400 (JSON rusak), dan 404.',
        proof: 'Orang lain bisa menjalankan koleksi itu dan mendapat status yang sama persis.',
      },
      refs: [
        { source: 'rest', note: 'Struktur controller dan representasi resource.' },
        { source: 'validation', note: 'Error validasi request body.' },
        { source: 'errors', note: 'Konsistensi format error.' },
      ],
      exercises: [
        {
          kind: 'choice',
          id: 'breaking-change',
          prompt: 'Perubahan mana yang **merusak** klien yang sudah ada?',
          multiple: true,
          options: [
            { text: 'Mengganti nama field response `total` menjadi `amount`.', correct: true },
            { text: 'Menambah field opsional `note` di response.', why: 'Klien yang mengabaikan field tak dikenal tetap berjalan.' },
            { text: 'Membuat field request `coupon` yang tadinya opsional menjadi wajib.', correct: true },
            { text: 'Menambah endpoint baru `GET /orders/{id}/items`.', why: 'Endpoint baru tidak memengaruhi klien lama.' },
          ],
          explanation: 'Klien lama masih mengirim/membaca bentuk lama. Rename field dan memperketat input membuat mereka gagal walau aplikasimu tetap start.',
        },
        {
          kind: 'choice',
          id: 'broken-json',
          prompt: 'Klien mengirim body `{"product": "Book", "quantity": }` (JSON rusak). Status yang tepat adalah…',
          options: [
            { text: '400 Bad Request', correct: true },
            { text: '500 Internal Server Error', why: 'Kesalahan ada pada request klien, bukan server.' },
            { text: '404 Not Found', why: 'Endpoint ada; masalahnya body tidak bisa dibaca.' },
            { text: '201 Created dengan quantity 0', why: 'Server tidak boleh menebak nilai dari JSON rusak.' },
          ],
          explanation: 'Spring melempar `HttpMessageNotReadableException` yang dipetakan ke 400. Pastikan advice-mu tidak menangkapnya sebagai 500.',
        },
        {
          kind: 'fill',
          id: 'location-header',
          prompt: 'Saat `curl -i` menampilkan response 201, header apa yang berisi alamat order yang baru dibuat?',
          answers: ['Location', 'Location:'],
          placeholder: 'Nama header',
          hint: 'Header yang diisi oleh `ResponseEntity.created(uri)`.',
          explanation: 'Header `Location` menunjuk ke resource baru, misalnya `Location: /orders/42`. Klien bisa langsung melakukan GET ke alamat itu.',
        },
      ],
    },
  ],
};

export default restApi;
