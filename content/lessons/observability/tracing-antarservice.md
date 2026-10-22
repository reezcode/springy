## Trace dan span

Satu klik "Buat pesanan" bisa melewati gateway, Order, Inventory, database, dan broker. **Distributed tracing** merekam perjalanan itu sebagai satu **trace**, yang terdiri dari banyak **span**:

```text
Trace 4bf92f35…
└─ POST /orders                        Order        320 ms
   ├─ SELECT orders …                  Order DB      12 ms
   ├─ POST /reservations               Order→Inv    260 ms
   │  └─ POST /reservations            Inventory    250 ms
   │     └─ UPDATE stock …             Inv DB       230 ms   ← lambat di sini
   └─ INSERT outbox …                  Order DB       8 ms
```

Setiap span mencatat nama operasi, waktu mulai, durasi, status, dan atribut seperti URL atau nama tabel. Tanpa tracing, kamu hanya tahu "checkout lambat"; dengan tracing, kamu tahu `UPDATE stock` di Inventory yang memakan waktu.

## Context propagation

Agar span di Inventory tergabung dengan trace dari Order, konteks trace harus **dikirim bersama request**. Standar yang dipakai Spring Boot secara default adalah W3C Trace Context:

```http
POST /reservations HTTP/1.1
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

Formatnya: versi, trace ID, parent span ID, dan flag (apakah di-sampling). Inventory membaca header ini dan membuat span anak dengan trace ID yang sama.

## Mengaktifkan di Spring Boot

Spring Boot 3 memakai **Micrometer Tracing** dengan bridge ke OpenTelemetry atau Brave. Contoh dengan OpenTelemetry dan ekspor OTLP:

```xml title="pom.xml"
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
  <groupId>io.opentelemetry</groupId>
  <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
```

```yaml title="application.yml"
management:
  tracing:
    sampling:
      probability: 1.0        # development: rekam semua
  otlp:
    tracing:
      endpoint: http://localhost:4318/v1/traces
spring:
  application:
    name: order-service       # muncul sebagai nama service di trace
```

Untuk mencoba lokal, jalankan backend seperti Jaeger yang menerima OTLP:

```shell
docker run --rm -d --name jaeger -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one
# buka http://localhost:16686
```

> [!NOTE] Nama properti bisa berbeda antarversi
> Konfigurasi exporter tracing berubah di beberapa rilis Spring Boot. Cocokkan nama properti dengan dokumentasi tracing untuk versi yang kamu pakai.

## Propagasi otomatis hanya jika kliennya diinstrumentasi

Header `traceparent` ditambahkan oleh instrumentasi Micrometer Observation pada klien HTTP. Spring Boot memasang instrumentasi itu pada **builder yang disediakan auto-configuration Spring Boot**:

```java title="Benar: memakai builder dari Spring Boot"
@Bean
RestClient inventoryClient(RestClient.Builder builder) {
  return builder.baseUrl("http://inventory:8080").build();
}
```

```java title="Salah: trace terputus"
RestClient client = RestClient.create("http://inventory:8080");
```

Klien yang dibuat sendiri tidak mengirim header, sehingga Inventory memulai trace baru dan gambaran end-to-end hilang. Hal yang sama berlaku untuk `RestTemplateBuilder`, `WebClient.Builder`, dan `RabbitTemplate` (aktifkan `spring.rabbitmq.template.observation-enabled` untuk messaging).

## Sampling

Merekam setiap request di produksi bisa mahal. **Sampling** menentukan proporsi trace yang direkam; default Spring Boot adalah 10% (`0.1`). Keputusan sampling diambil di awal dan ikut dipropagasi, jadi satu trace direkam utuh atau tidak sama sekali.

> [!TIP] Request yang gagal sering paling penting
> Head-based sampling 10% berarti 90% request gagal juga tidak terekam. Collector seperti OpenTelemetry Collector mendukung *tail-based sampling*: simpan semua trace yang error atau lambat, dan sebagian kecil sisanya.
