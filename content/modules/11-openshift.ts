import type { ModuleInput } from '../types.ts';

const r = String.raw;

const openshift: ModuleInput = {
  slug: 'openshift',
  title: 'Pengenalan OpenShift',
  subtitle: 'Deploy aplikasi dan kenali resource utama OpenShift.',
  description:
    'Gunakan project, Pod, Deployment, Service, dan Route untuk menjalankan aplikasi di OpenShift. Siapkan image yang mendukung arbitrary UID, lalu tentukan resource request dan limit untuk aplikasi JVM.',
  category: 'Operasional',
  hours: '4–6',
  tint: 'peach',
  icon: 'layers',
  lessons: [
    {
      slug: 'ocp-kubernetes-project',
      title: 'OCP, Kubernetes & project',
      summary: 'OpenShift dibangun di atas Kubernetes dan menambahkan kemampuan untuk developer dan operasi. Project adalah ruang kerja dengan akses dan kuota sendiri.',
      minutes: 30,
      objectives: [
        'Menjelaskan hubungan OpenShift dan Kubernetes.',
        'Memahami project/namespace sebagai batas kerja.',
        'Menggunakan `oc` untuk login dan menjelajah resource.',
      ],
      keyPoints: [
        'OpenShift Container Platform (OCP) adalah distribusi Kubernetes dari Red Hat dengan tambahan seperti Route, build, console web, dan kebijakan keamanan ketat.',
        'Project adalah namespace Kubernetes dengan annotation dan kontrol akses tambahan.',
        '`oc` adalah superset `kubectl`: perintah `kubectl` umumnya juga berjalan dengan `oc`.',
        'Pada learning path ini fokusnya penggunaan cluster sebagai developer, bukan instalasi atau administrasi.',
      ],
      practice: {
        task: 'Login ke sandbox OpenShift (misalnya Developer Sandbox), pilih project, dan daftar resource yang ada lewat console dan `oc`.',
        proof: 'Bisa membedakan cluster, project, dan workload, serta menjelaskan apa yang ditampilkan `oc get all`.',
      },
      refs: [{ source: 'ocp', note: 'Arsitektur OpenShift Container Platform 4.20.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'ocp-k8s',
          prompt: 'Pernyataan mana yang paling tepat tentang OpenShift dan Kubernetes?',
          options: [
            { text: 'OpenShift adalah platform berbasis Kubernetes dengan fitur tambahan untuk developer, keamanan, dan operasi.', correct: true },
            { text: 'OpenShift adalah pengganti Kubernetes yang tidak kompatibel.', why: 'Resource Kubernetes standar seperti Deployment dan Service berjalan di OpenShift.' },
            { text: 'OpenShift hanyalah nama lain dari Docker.', why: 'Docker adalah container engine; OpenShift adalah platform orkestrasi.' },
            { text: 'Kubernetes adalah plugin OpenShift.', why: 'Hubungannya terbalik: OpenShift dibangun di atas Kubernetes.' },
          ],
          explanation: 'Pengetahuan Kubernetes langsung terpakai di OpenShift. OpenShift menambahkan resource seperti Route dan kebijakan seperti Security Context Constraints.',
        },
        {
          kind: 'fill',
          id: 'oc-project',
          prompt: 'Perintah `oc` apa yang berpindah ke project `belajar-microservices`?',
          answers: ['oc project belajar-microservices'],
          placeholder: 'oc …',
          hint: 'Subperintah dengan nama yang sama seperti konsepnya.',
          explanation: '`oc project <nama>` mengganti project aktif. `oc projects` menampilkan semua project yang bisa kamu akses.',
        },
      ],
    },
    {
      slug: 'pod-deployment-service',
      title: 'Pod, Deployment & Service',
      summary: 'Pod menjalankan container. Deployment mengelola jumlah replica dan rollout. Service memberi alamat stabil untuk sekumpulan pod.',
      minutes: 40,
      objectives: [
        'Menjelaskan peran Pod, Deployment, ReplicaSet, dan Service.',
        'Menulis manifest Deployment dengan dua replica.',
        'Melakukan rollout dan rollback.',
      ],
      keyPoints: [
        'Pod adalah unit terkecil; pod bisa mati dan diganti kapan saja dengan IP baru.',
        'Deployment menjaga jumlah replica yang diinginkan dan melakukan rolling update.',
        'Service memilih pod lewat label selector dan memberi nama DNS serta IP virtual yang stabil.',
        '`oc rollout status` dan `oc rollout undo` memantau dan membatalkan rilis.',
        'Data yang harus bertahan tidak disimpan di filesystem pod.',
      ],
      practice: {
        task: 'Deploy aplikasi latihan dengan dua replica dan hapus salah satu pod secara manual.',
        proof: 'Pod pengganti muncul otomatis dan alamat Service tidak berubah.',
      },
      refs: [{ source: 'deployment', note: 'Deployment, rolling update, dan rollback.' }],
      exercises: [
        {
          kind: 'code',
          id: 'deployment-yaml',
          prompt: 'Lengkapi Deployment: 2 replica, selector dan label pod `app: order`, dan container memakai image `image-registry.openshift-image-registry.svc:5000/belajar/order:0.1` pada port 8080.',
          language: 'yaml',
          starter: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order
spec:
  # TODO`,
          solution: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order
spec:
  replicas: 2
  selector:
    matchLabels:
      app: order
  template:
    metadata:
      labels:
        app: order
    spec:
      containers:
        - name: order
          image: image-registry.openshift-image-registry.svc:5000/belajar/order:0.1
          ports:
            - containerPort: 8080`,
          checks: [
            { label: '`replicas: 2`', pattern: r`^\s+replicas\s*:\s*2\s*$`, hint: 'Tambahkan `replicas: 2` di bawah `spec`.' },
            { label: 'Selector `matchLabels: app: order`', pattern: r`selector\s*:\s*\n\s+matchLabels\s*:\s*\n\s+app\s*:\s*order`, hint: 'Tambahkan `selector: matchLabels: app: order`.' },
            { label: 'Label pod di template `app: order`', pattern: r`template\s*:\s*\n\s+metadata\s*:\s*\n\s+labels\s*:\s*\n\s+app\s*:\s*order`, hint: 'Label di `template.metadata.labels` harus cocok dengan selector.' },
            { label: 'Image yang benar', pattern: r`image\s*:\s*image-registry\.openshift-image-registry\.svc:5000/belajar/order:0\.1`, hint: 'Salin nama image persis dari soal.' },
            { label: '`containerPort: 8080`', pattern: r`containerPort\s*:\s*8080`, hint: 'Tambahkan `ports: - containerPort: 8080`.' },
          ],
          explanation: 'Selector dan label template harus cocok; itulah cara Deployment (lewat ReplicaSet) tahu pod mana miliknya. Service nanti memakai label yang sama.',
        },
        {
          kind: 'choice',
          id: 'why-service',
          prompt: 'Kenapa aplikasi lain sebaiknya memanggil Order lewat Service, bukan IP pod?',
          options: [
            { text: 'IP pod berubah saat pod diganti; Service memberi nama DNS dan IP stabil serta membagi beban ke semua pod yang siap.', correct: true },
            { text: 'IP pod tidak bisa diakses sama sekali.', why: 'Bisa diakses di dalam cluster, tetapi tidak stabil.' },
            { text: 'Service membuat aplikasi lebih cepat.', why: 'Manfaatnya stabilitas alamat dan load balancing, bukan kecepatan.' },
            { text: 'Service menyimpan data aplikasi.', why: 'Service tidak menyimpan data.' },
          ],
          explanation: 'Pod bersifat sementara. Service hanya meneruskan traffic ke pod yang lolos readiness probe, sehingga rollout dan restart tidak terlihat oleh pemanggil.',
        },
      ],
    },
    {
      slug: 'route-akses',
      title: 'Route & akses aplikasi',
      summary: 'Route membuka Service ke luar cluster melalui router OpenShift, lengkap dengan hostname dan terminasi TLS.',
      minutes: 30,
      objectives: [
        'Membuat Route untuk sebuah Service.',
        'Membedakan terminasi TLS edge, passthrough, dan re-encrypt.',
        'Memastikan `targetPort` cocok dengan port Service.',
      ],
      keyPoints: [
        'Route adalah resource khas OpenShift untuk ekspos HTTP(S) ke luar cluster (Kubernetes memakai Ingress/Gateway).',
        'Edge: TLS berakhir di router; router ke pod memakai HTTP.',
        'Passthrough: TLS diteruskan apa adanya sampai pod.',
        'Re-encrypt: TLS berakhir di router lalu dienkripsi ulang ke pod.',
        'Route menunjuk Service, dan Service menunjuk pod lewat selector.',
      ],
      practice: {
        task: 'Buat Route edge ke Service `order` pada port 8080.',
        proof: 'Aplikasi dapat diakses dengan HTTPS melalui host Route dan `/actuator/health` menjawab UP.',
      },
      refs: [{ source: 'route', note: 'Route, terminasi TLS, dan konfigurasi ingress di OCP 4.20.' }],
      exercises: [
        {
          kind: 'choice',
          id: 'tls-edge',
          prompt: 'Dengan Route berterminasi **edge**, bagian mana yang terenkripsi TLS?',
          options: [
            { text: 'Dari browser ke router OpenShift saja; dari router ke pod memakai HTTP biasa.', correct: true },
            { text: 'Dari browser sampai pod, tanpa didekripsi di tengah.', why: 'Itu terminasi passthrough.' },
            { text: 'Tidak ada yang terenkripsi.', why: 'Edge mengenkripsi koneksi dari klien ke router.' },
            { text: 'Hanya dari router ke pod.', why: 'Terbalik; edge mengakhiri TLS di router.' },
          ],
          explanation: 'Edge paling sederhana untuk latihan. Jika jaringan internal cluster juga harus terenkripsi, gunakan re-encrypt atau passthrough.',
        },
        {
          kind: 'order',
          id: 'route-path',
          prompt: 'Urutkan jalur request dari pengguna sampai ke aplikasi Spring Boot.',
          items: ['Browser mengakses `https://order-belajar.apps.cluster.example.com`.', 'Router OpenShift menerima request dan mencocokkan Route.', 'Route meneruskan ke Service `order`.', 'Service memilih salah satu pod yang siap.', 'Container Spring Boot di pod memproses request di port 8080.'],
          explanation: 'Setiap lapisan punya tanggung jawab sendiri: Route untuk akses luar dan TLS, Service untuk alamat stabil dan load balancing, pod untuk menjalankan aplikasi.',
        },
      ],
    },
    {
      slug: 'arbitrary-uid-resources',
      title: 'Arbitrary UID & batas resource',
      summary: 'OpenShift menjalankan container dengan UID acak dari rentang project. Image harus siap untuk itu, dan setiap container perlu resource request/limit yang jelas.',
      minutes: 40,
      objectives: [
        'Menyiapkan image yang berjalan dengan arbitrary UID (group root, izin group).',
        'Menetapkan resource request dan limit untuk aplikasi JVM.',
        'Menghindari melonggarkan SCC untuk menutupi masalah image.',
      ],
      keyPoints: [
        'SCC `restricted-v2` (default) menjalankan container dengan UID acak dari rentang project dan GID 0.',
        'Direktori yang perlu ditulis harus dimiliki group root (GID 0) dan berizin tulis untuk group.',
        'Request menentukan penjadwalan; limit membatasi pemakaian. Melebihi limit memori berarti OOMKilled.',
        'JVM modern membaca limit container; atur `-XX:MaxRAMPercentage` agar heap tidak memakan seluruh limit.',
        'Jangan meminta SCC `anyuid` atau `privileged` hanya untuk menutupi masalah permission image.',
      ],
      practice: {
        task: 'Jalankan image latihan dengan UID berbeda (`docker run --user 123456:0`) lalu deploy ke sandbox dengan resource request/limit.',
        proof: 'Aplikasi start tanpa root dan tanpa SCC tambahan, dan pod tidak OOMKilled di beban latihan.',
      },
      refs: [
        { source: 'ocimage', note: 'Panduan image yang mendukung arbitrary user ID.' },
        { source: 'probe', note: 'Probe tetap diperlukan di samping resource.' },
      ],
      exercises: [
        {
          kind: 'code',
          id: 'arbitrary-uid-dockerfile',
          prompt: 'Siapkan direktori `/app/data` agar bisa ditulis oleh UID acak: ubah group ke root (0) dan beri izin group sama dengan owner, lalu jalankan sebagai `USER 1001`.',
          language: 'dockerfile',
          starter: `FROM eclipse-temurin:21-jre
WORKDIR /app
COPY app.jar app.jar
RUN mkdir -p /app/data
USER root
ENTRYPOINT ["java", "-jar", "/app/app.jar"]`,
          solution: `FROM eclipse-temurin:21-jre
WORKDIR /app
COPY app.jar app.jar
RUN mkdir -p /app/data && \\
    chgrp -R 0 /app/data && \\
    chmod -R g=u /app/data
USER 1001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]`,
          checks: [
            { label: 'Group direktori diubah ke root: `chgrp -R 0`', pattern: r`chgrp\s+(-R\s+)?0\s+/app/data|chown\s+(-R\s+)?\d*:0\s+/app/data`, hint: 'Tambahkan `chgrp -R 0 /app/data`.' },
            { label: 'Izin group sama dengan owner: `chmod -R g=u`', pattern: r`chmod\s+(-R\s+)?g=u\s+/app/data|chmod\s+(-R\s+)?g\+rwX?\s+/app/data`, hint: 'Tambahkan `chmod -R g=u /app/data`.' },
            { label: '`USER 1001` (non-root)', pattern: r`^USER\s+1001\s*$`, hint: 'Ganti `USER root` dengan `USER 1001`.' },
            { label: 'Tidak `USER root`', pattern: r`^USER\s+(root|0)\s*$`, absent: true, hint: 'Hapus `USER root`.' },
          ],
          explanation: 'OpenShift mengganti UID dengan nilai acak, tetapi proses selalu anggota group root (GID 0). Izin berbasis group membuat direktori bisa ditulis apa pun UID-nya.',
        },
        {
          kind: 'choice',
          id: 'oomkilled',
          prompt: 'Pod berstatus `OOMKilled` berulang kali. Apa artinya dan langkah pertama yang tepat?',
          options: [
            { text: 'Container melebihi limit memori; periksa pemakaian memori JVM (heap + non-heap) dan sesuaikan limit atau `MaxRAMPercentage`.', correct: true },
            { text: 'Disk penuh; hapus log.', why: 'OOMKilled terkait memori, bukan disk.' },
            { text: 'Image tidak ditemukan; periksa nama image.', why: 'Itu `ImagePullBackOff`.' },
            { text: 'Readiness probe gagal; matikan probe.', why: 'Probe yang gagal tidak menyebabkan OOMKilled.' },
          ],
          explanation: 'Memori JVM bukan hanya heap: ada metaspace, thread stack, buffer, dan code cache. Sisakan ruang di bawah limit, misalnya `-XX:MaxRAMPercentage=75`.',
        },
        {
          kind: 'choice',
          id: 'anyuid',
          prompt: 'Image gagal start di OpenShift dengan `Permission denied` saat menulis ke `/app/data`. Solusi yang paling tepat adalah…',
          options: [
            { text: 'Perbaiki image: direktori milik group 0 dengan izin tulis group.', correct: true },
            { text: 'Minta admin memberi SCC `anyuid` agar bisa jalan sebagai root.', why: 'Melonggarkan keamanan cluster untuk menutupi masalah image.' },
            { text: 'Minta SCC `privileged`.', why: 'Memberi akses berlebihan ke host; tidak dibutuhkan aplikasi web.' },
            { text: 'Ubah semua file menjadi `chmod 777`.', why: 'Terlalu permisif; izin group sudah cukup.' },
          ],
          explanation: 'Image yang mengikuti panduan arbitrary UID berjalan di SCC `restricted-v2` default tanpa izin tambahan.',
        },
      ],
    },
  ],
};

export default openshift;
