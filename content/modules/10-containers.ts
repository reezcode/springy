import type { ModuleInput } from '../types.ts';

const r = String.raw;

const containers: ModuleInput = {
  slug: 'docker-podman',
  title: 'Docker & Podman',
  subtitle: 'Buat image dan jalankan aplikasi dengan Docker atau Podman.',
  description:
    'Pelajari image, container, dan registry, lalu tulis Dockerfile multi-stage yang berjalan sebagai non-root. Hubungkan aplikasi dan database lewat Compose, simpan data di volume, dan coba Podman rootless.',
  category: 'Operasional',
  hours: '6–9',
  tint: 'yellow',
  icon: 'box',
  lessons: [
    {
      slug: 'image-container-registry',
      title: 'Image, container & registry',
      summary: 'Image adalah paket filesystem dan konfigurasi yang tidak berubah. Container adalah proses terisolasi yang dijalankan dari image.',
      minutes: 35,
      objectives: [
        'Membedakan image, container, dan registry.',
        'Memahami layer image dan cache build.',
        'Menggunakan tag dan digest dengan benar.',
      ],
      keyPoints: [
        'Image bersifat immutable dan tersusun dari layer; container menambahkan layer tulis tipis di atasnya.',
        'Container adalah proses biasa di host yang diisolasi dengan namespace dan cgroup, bukan VM.',
        'Registry menyimpan dan mendistribusikan image (Docker Hub, Quay, registry internal).',
        'Tag (`order:0.1`) bisa dipindahkan ke image lain; digest (`@sha256:...`) mengidentifikasi isi secara pasti.',
        'Docker dan Podman sama-sama menjalankan image berformat OCI.',
      ],
      practice: {
        task: 'Build image `order-service:0.1`, jalankan, lalu periksa layer-nya dengan `docker history`.',
        proof: 'Bisa menjelaskan image, container, registry, serta perbedaan tag dan digest.',
      },
      refs: [{ source: 'image', note: 'Penjelasan image, layer, dan registry.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'image-vs-container',
          prompt: 'Pernyataan mana yang benar?',
          multiple: true,
          options: [
            { text: 'Satu image bisa dijalankan menjadi banyak container sekaligus.', correct: true },
            { text: 'Perubahan file di dalam container tidak mengubah image asalnya.', correct: true },
            { text: 'Container adalah virtual machine dengan kernel sendiri.', why: 'Container berbagi kernel host; isolasinya lewat namespace dan cgroup.' },
            { text: 'Image berubah setiap kali container ditulisi.', why: 'Image immutable; tulisan masuk ke layer milik container.' },
          ],
          explanation: 'Image seperti class, container seperti object: satu blueprint, banyak instance dengan state masing-masing.',
        },
        {
          kind: 'choice',
          id: 'tag-digest',
          prompt: 'Kamu ingin memastikan produksi menjalankan isi image yang persis sama dengan yang sudah diuji. Referensi mana yang paling tepat?',
          options: [
            { text: '`registry.example.com/order@sha256:3f1c…`', correct: true },
            { text: '`registry.example.com/order:latest`', why: '`latest` hanyalah tag biasa yang bisa menunjuk image berbeda kapan saja.' },
            { text: '`registry.example.com/order:0.1`', why: 'Tag bisa ditimpa (di-push ulang) dengan isi berbeda.' },
            { text: '`order`', why: 'Tanpa registry dan tag, image ditafsirkan sebagai `docker.io/library/order:latest`.' },
          ],
          explanation: 'Digest adalah hash isi image. Selama digest sama, isinya identik byte demi byte.',
        },
        {
          kind: 'order',
          id: 'image-flow',
          prompt: 'Urutkan alur dari kode sampai container berjalan di server lain.',
          items: ['Build JAR dengan `./mvnw package`.', 'Build image dari Dockerfile.', 'Push image ke registry.', 'Server menarik (pull) image dari registry.', 'Server menjalankan container dari image.'],
          explanation: 'Registry adalah perantara distribusi: build sekali di CI, jalankan di mana pun yang bisa menarik image.',
        },
      ],
    },
    {
      slug: 'dockerfile-non-root',
      title: 'Dockerfile & proses non-root',
      summary: 'Dockerfile multi-stage menghasilkan image runtime yang kecil, memanfaatkan cache layer, dan menjalankan aplikasi tanpa hak root.',
      minutes: 45,
      objectives: [
        'Menulis Dockerfile multi-stage untuk aplikasi Spring Boot.',
        'Menjalankan proses sebagai user non-root.',
        'Memanfaatkan layered JAR untuk build yang lebih cepat.',
      ],
      keyPoints: [
        'Multi-stage: stage build memakai JDK + Maven; stage runtime hanya JRE + aplikasi.',
        'Urutkan instruksi dari yang jarang berubah ke yang sering berubah agar cache layer efektif.',
        '`USER` dengan UID non-root membatasi dampak jika aplikasi dibobol.',
        '`EXPOSE` hanya dokumentasi; port tetap harus dipublikasikan dengan `-p`.',
        'Gunakan bentuk exec (`["java", "-jar", ...]`) agar sinyal SIGTERM sampai ke JVM.',
      ],
      practice: {
        task: 'Bangun image dengan Dockerfile multi-stage lalu periksa user proses di dalam container.',
        proof: 'Service dapat diakses dari host, dan `id` di dalam container tidak menunjukkan UID 0.',
      },
      refs: [{ source: 'dockerfile', note: 'Dockerfile dan layered JAR untuk Spring Boot.' }],
      exercises: [
        {
          kind: 'code',
          id: 'runtime-stage',
          prompt: 'Lengkapi stage runtime: base image `eclipse-temurin:21-jre`, salin JAR dari stage `build`, jalankan sebagai user `10001`, dan gunakan ENTRYPOINT bentuk exec.',
          language: 'dockerfile',
          starter: `FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY . .
RUN ./mvnw -q package -DskipTests

# TODO: stage runtime
`,
          solution: `FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY . .
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]`,
          checks: [
            { label: 'Stage runtime `FROM eclipse-temurin:21-jre`', pattern: r`^FROM\s+eclipse-temurin:21-jre(\S*)?\s*$`, hint: 'Tambahkan `FROM eclipse-temurin:21-jre` sebagai stage kedua.' },
            { label: 'Menyalin JAR dengan `COPY --from=build`', pattern: r`^COPY\s+--from=build\s+\S+\.jar\s+\S+`, hint: 'Contoh: `COPY --from=build /src/target/*.jar app.jar`.' },
            { label: '`USER 10001` (non-root)', pattern: r`^USER\s+10001(:\d+)?\s*$`, hint: 'Tambahkan `USER 10001` sebelum ENTRYPOINT.' },
            { label: 'ENTRYPOINT bentuk exec (JSON array)', pattern: r`^ENTRYPOINT\s+\[\s*"java"\s*,\s*"-jar"\s*,\s*"[^"]+\.jar"\s*\]`, hint: 'Tulis `ENTRYPOINT ["java", "-jar", "/app/app.jar"]`.' },
            { label: 'Tidak menjalankan sebagai root', pattern: r`^USER\s+(root|0)\s*$`, absent: true, hint: 'Jangan set `USER root`.' },
          ],
          explanation: 'Image runtime kini tidak membawa Maven, source code, atau JDK lengkap. Bentuk exec menjadikan `java` PID 1 sehingga menerima SIGTERM untuk graceful shutdown.',
        },
        {
          kind: 'choice',
          id: 'expose',
          prompt: 'Dockerfile berisi `EXPOSE 8080`. Container dijalankan dengan `docker run order:0.1` tanpa flag lain. Bisakah `curl localhost:8080` dari host mengaksesnya?',
          options: [
            { text: 'Tidak. `EXPOSE` hanya dokumentasi; port perlu dipublikasikan dengan `-p 8080:8080`.', correct: true },
            { text: 'Ya, `EXPOSE` otomatis membuka port ke host.', why: '`EXPOSE` tidak memublikasikan port.' },
            { text: 'Ya, tetapi hanya di Linux.', why: 'Perilakunya sama di semua platform.' },
            { text: 'Tidak, karena port 8080 dilarang di container.', why: 'Port 8080 boleh dipakai.' },
          ],
          explanation: '`-p 127.0.0.1:8080:8080` memetakan port host ke port container, dan hanya membukanya untuk loopback host.',
        },
      ],
    },
    {
      slug: 'network-volume-compose',
      title: 'Network, volume & Compose',
      summary: 'Container berkomunikasi lewat network dengan nama service sebagai hostname. Volume menyimpan data di luar lifecycle container. Compose merangkai semuanya.',
      minutes: 45,
      objectives: [
        'Menghubungkan container lewat network bernama.',
        'Menyimpan data PostgreSQL di named volume.',
        'Menulis `compose.yaml` dengan healthcheck dan `depends_on`.',
      ],
      keyPoints: [
        'Di network buatan pengguna, container saling menemukan lewat nama (DNS internal).',
        '`localhost` di dalam container berarti container itu sendiri, bukan host.',
        'Named volume menyimpan data walau container dihapus dan dibuat ulang.',
        '`depends_on` biasa hanya menunggu container start; gunakan `condition: service_healthy` dengan healthcheck.',
        'Aplikasi tetap perlu tahan terhadap dependency yang belum siap (retry koneksi).',
      ],
      practice: {
        task: 'Jalankan Order dan PostgreSQL dengan Compose pada network latihan.',
        proof: 'Data tetap ada setelah container aplikasi dan database dibuat ulang.',
      },
      refs: [{ source: 'compose', note: 'depends_on dengan kondisi service_healthy.' }],
      exercises: [
        {
          kind: 'code',
          id: 'compose-health',
          prompt: 'Lengkapi `compose.yaml` agar service `order` baru start setelah `db` sehat. Tambahkan healthcheck `pg_isready` pada `db`.',
          language: 'yaml',
          starter: `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: orders
      POSTGRES_PASSWORD: secret
  order:
    image: order-service:0.1
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/orders
    depends_on:
      - db`,
          solution: `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: orders
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U orders -d orders"]
      interval: 5s
      retries: 10
  order:
    image: order-service:0.1
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/orders
    depends_on:
      db:
        condition: service_healthy`,
          checks: [
            { label: 'Healthcheck dengan `pg_isready` pada `db`', pattern: r`healthcheck\s*:\s*\n\s+test\s*:[^\n]*pg_isready`, hint: 'Tambahkan `healthcheck: test: ["CMD-SHELL", "pg_isready -U orders -d orders"]` di service `db`.' },
            { label: '`depends_on.db.condition: service_healthy`', pattern: r`depends_on\s*:\s*\n\s+db\s*:\s*\n\s+condition\s*:\s*service_healthy`, hint: 'Ubah ke bentuk panjang: `depends_on: db: condition: service_healthy`.' },
            { label: 'Tidak memakai bentuk list `- db`', pattern: r`depends_on\s*:\s*\n\s+-\s*db`, absent: true, hint: 'Bentuk list hanya menunggu container start.' },
          ],
          explanation: 'Dengan `service_healthy`, Compose menunggu `pg_isready` sukses sebelum menjalankan `order`. Perhatikan URL memakai hostname `db`, nama service di network Compose.',
        },
        {
          kind: 'choice',
          id: 'localhost-in-container',
          prompt: 'Aplikasi di dalam container memakai `jdbc:postgresql://localhost:5432/orders`, sedangkan PostgreSQL berjalan di container lain bernama `db`. Apa yang terjadi?',
          options: [
            { text: 'Koneksi ditolak, karena `localhost` merujuk ke container aplikasi itu sendiri.', correct: true },
            { text: 'Berhasil, karena semua container berbagi localhost.', why: 'Setiap container punya network namespace sendiri.' },
            { text: 'Berhasil hanya di Podman.', why: 'Kecuali dalam satu pod, Podman pun memisahkan network namespace.' },
            { text: 'Docker otomatis mengganti localhost dengan db.', why: 'Docker tidak menulis ulang konfigurasi aplikasi.' },
          ],
          explanation: 'Gunakan nama service (`db`) sebagai hostname. Pengecualian: container dalam satu Podman pod atau Kubernetes pod memang berbagi localhost.',
        },
      ],
    },
    {
      slug: 'podman-rootless',
      title: 'Podman rootless & troubleshooting',
      summary: 'Podman menjalankan container tanpa daemon dan bisa sepenuhnya rootless. Kuasai perintah diagnosis untuk port, log, dan izin volume.',
      minutes: 40,
      objectives: [
        'Menjalankan image dengan Podman, termasuk di macOS/Windows lewat Podman machine.',
        'Memahami pemetaan UID pada mode rootless.',
        'Mendiagnosis port salah dan izin volume dengan `logs`, `inspect`, dan `exec`.',
      ],
      keyPoints: [
        'Podman kompatibel dengan sebagian besar perintah Docker (`podman run`, `podman build`).',
        'Rootless: root di dalam container dipetakan ke user biasa di host lewat user namespace.',
        'Di macOS/Windows, container berjalan di VM Linux yang dibuat `podman machine`.',
        'Nama image pendek bisa ambigu; gunakan nama lengkap seperti `docker.io/library/postgres:16` atau `localhost/order:0.1`.',
        'Masalah izin volume rootless sering diatasi dengan opsi `:Z` (SELinux) atau `--userns=keep-id`.',
      ],
      practice: {
        task: 'Jalankan image lewat Podman, lalu sengaja buat dua kesalahan: port salah dan volume tanpa izin tulis.',
        proof: 'Bisa mendiagnosis keduanya dengan `podman logs`, `podman inspect`, dan `podman exec`.',
      },
      refs: [{ source: 'podman', note: 'Opsi `podman run`: publish, volume, userns.' }],
      exercises: [
        {
          kind: 'order',
          id: 'debug-steps',
          prompt: 'Container `order-lab` berjalan tetapi `curl localhost:8080` gagal. Urutkan langkah diagnosis yang masuk akal.',
          items: [
            'Cek container masih berjalan: `podman ps`.',
            'Baca log aplikasi: `podman logs order-lab`.',
            'Periksa port mapping: `podman port order-lab`.',
            'Uji dari dalam container: `podman exec order-lab curl -s localhost:8080/actuator/health`.',
          ],
          explanation: 'Mulai dari yang paling luas (apakah prosesnya hidup), lalu menyempit: log, port mapping, dan akhirnya pengujian dari dalam container untuk memisahkan masalah aplikasi dari masalah jaringan.',
        },
        {
          kind: 'fill',
          id: 'machine-start',
          prompt: 'Perintah apa yang menyalakan VM Linux Podman di macOS sebelum menjalankan container?',
          answers: ['podman machine start'],
          placeholder: 'podman …',
          hint: 'Subperintah `machine`.',
          explanation: 'Sekali saja jalankan `podman machine init` untuk membuat VM, lalu `podman machine start` setiap kali ingin memakainya.',
        },
        {
          kind: 'choice',
          id: 'listen-address',
          prompt: '`podman logs` menunjukkan aplikasi sudah start di port 8080, `-p 8080:8080` sudah benar, tetapi host tetap tidak bisa terhubung. Konfigurasi aplikasi menetapkan `server.address=127.0.0.1`. Apa masalahnya?',
          options: [
            { text: 'Aplikasi hanya listen di loopback container; ia harus listen di `0.0.0.0`.', correct: true },
            { text: 'Podman tidak mendukung port 8080.', why: 'Port 8080 tidak dibatasi.' },
            { text: 'Harus memakai `--privileged`.', why: 'Hak istimewa tidak relevan dan berbahaya.' },
            { text: 'Image harus di-push ke registry dulu.', why: 'Image lokal bisa dijalankan langsung.' },
          ],
          explanation: 'Trafik dari host masuk lewat interface network container, bukan loopback-nya. Hapus `server.address` atau set ke `0.0.0.0`.',
        },
      ],
    },
  ],
};

export default containers;
