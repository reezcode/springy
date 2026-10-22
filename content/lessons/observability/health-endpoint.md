## Monitoring vs observability

**Monitoring** menjawab pertanyaan yang sudah kamu ketahui sebelumnya: "apakah CPU di atas 80%?". **Observability** adalah kemampuan menjawab pertanyaan *baru* tentang perilaku sistem dari sinyal yang dikeluarkannya, misalnya "kenapa hanya pelanggan dari satu wilayah yang gagal checkout sejak pukul 14.05?". Di sistem terdistribusi, pertanyaan baru seperti itu muncul setiap hari.

Langkah pertama adalah membuat aplikasi bisa menjawab pertanyaan paling dasar: *apakah kamu sehat?*

## Spring Boot Actuator

Tambahkan `spring-boot-starter-actuator`. Actuator menyediakan endpoint operasional di bawah `/actuator`.

| Endpoint | Isi | Sensitif? |
| --- | --- | --- |
| `health` | Status kesehatan aplikasi dan komponennya | Rendah (detail bisa sensitif) |
| `info` | Info build, git, versi | Rendah |
| `metrics` | Daftar dan nilai metrics | Sedang |
| `prometheus` | Metrics format Prometheus | Sedang |
| `env`, `configprops` | Konfigurasi dan environment | **Tinggi**: bisa berisi rahasia |
| `heapdump`, `threaddump` | Isi memori dan thread | **Tinggi** |
| `loggers` | Melihat dan mengubah level log | Tinggi (bisa diubah) |

Secara default hanya `health` yang diekspos lewat HTTP.

```yaml title="application.yml"
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  endpoint:
    health:
      show-details: when-authorized
  info:
    git:
      mode: simple
```

> [!WARNING] Jangan ekspos semuanya
> `include: "*"` di aplikasi yang bisa diakses dari internet berarti siapa pun bisa mengunduh heap dump (berisi token dan data pengguna di memori) atau membaca konfigurasi. Ekspos secukupnya, lindungi dengan Spring Security, atau pindahkan ke port manajemen terpisah (`management.server.port`) yang tidak dibuka ke publik.

## Membaca /actuator/health

```shell
curl -s localhost:8080/actuator/health
```

```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP", "details": { "database": "PostgreSQL" } },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

Spring Boot otomatis menambahkan **health indicator** untuk komponen yang terdeteksi: datasource, disk, RabbitMQ, Redis, dan lainnya. Status agregat mengikuti komponen terburuk. Jika database mati, status menjadi `DOWN` dan HTTP status 503.

| Status | HTTP default |
| --- | --- |
| `UP` | 200 |
| `DOWN` | 503 |
| `OUT_OF_SERVICE` | 503 |
| `UNKNOWN` | 200 |

## Health indicator kustom

```java
@Component
class InventoryHealthIndicator implements HealthIndicator {
  private final InventoryGateway inventory;

  InventoryHealthIndicator(InventoryGateway inventory) {
    this.inventory = inventory;
  }

  @Override
  public Health health() {
    return inventory.ping()
        ? Health.up().build()
        : Health.down().withDetail("reason", "Inventory tidak merespons").build();
  }
}
```

> [!NOTE] Hati-hati menambahkan dependency eksternal
> Indicator yang memeriksa service lain akan membuat health Order `DOWN` ketika Inventory down. Itu informatif untuk dashboard, tetapi berbahaya jika health yang sama dipakai untuk memutuskan restart. Materi terakhir modul ini membahas cara memisahkannya dengan health group.

## Info build

Tambahkan goal `build-info` pada `spring-boot-maven-plugin` dan plugin `git-commit-id`, maka `/actuator/info` menampilkan versi dan commit yang sedang berjalan. Saat insiden, pertanyaan "versi berapa yang ter-deploy?" langsung terjawab.
