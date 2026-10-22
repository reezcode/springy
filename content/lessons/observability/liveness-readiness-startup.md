## Platform perlu tahu dua hal berbeda

Platform container seperti Kubernetes dan OpenShift terus bertanya kepada setiap instans aplikasi:

1. **Apakah kamu siap menerima trafik?** Jika tidak, jangan kirimi request untuk sementara.
2. **Apakah kamu masih hidup dengan sehat?** Jika tidak, matikan dan jalankan ulang.

Keduanya sering dicampur, padahal tindakan yang diambil sangat berbeda.

| Probe | Pertanyaan | Jika gagal |
| --- | --- | --- |
| **Readiness** | Siap melayani request? | Pod dikeluarkan dari endpoint Service (tidak menerima trafik) |
| **Liveness** | Proses masih berfungsi? | Container **di-restart** |
| **Startup** | Sudah selesai start? | Liveness/readiness ditunda; jika melewati batas, container di-restart |

## Health group di Spring Boot

Spring Boot menyediakan dua health group yang mengikuti *availability state* aplikasi:

```text
/actuator/health/liveness   → LivenessState: CORRECT / BROKEN
/actuator/health/readiness  → ReadinessState: ACCEPTING_TRAFFIC / REFUSING_TRAFFIC
```

Group ini otomatis aktif saat aplikasi berjalan di Kubernetes. Di luar Kubernetes, misalnya untuk mencoba lokal:

```yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
```

Saat start, aplikasi baru melaporkan `ACCEPTING_TRAFFIC` setelah `ApplicationContext` siap dan runner selesai. Saat shutdown dengan graceful shutdown aktif, readiness berubah menjadi `REFUSING_TRAFFIC` terlebih dahulu sehingga request baru berhenti datang sebelum proses benar-benar berhenti.

## Konfigurasi probe

```yaml title="deployment.yaml (cuplikan)"
containers:
  - name: order
    image: registry.example.com/order:0.1
    ports:
      - containerPort: 8080
    startupProbe:
      httpGet:
        path: /actuator/health/liveness
        port: 8080
      periodSeconds: 5
      failureThreshold: 24        # beri waktu start sampai 2 menit
    readinessProbe:
      httpGet:
        path: /actuator/health/readiness
        port: 8080
      periodSeconds: 5
    livenessProbe:
      httpGet:
        path: /actuator/health/liveness
        port: 8080
      periodSeconds: 10
      failureThreshold: 3
```

> [!TIP] Startup probe untuk aplikasi JVM
> Aplikasi Spring Boot bisa butuh puluhan detik untuk start di container dengan CPU terbatas. Tanpa startup probe, liveness bisa gagal sebelum aplikasi selesai start dan container di-restart terus-menerus (*crash loop*). Startup probe menunda liveness sampai start selesai.

## Jangan taruh dependency bersama di liveness

> [!WARNING] Restart massal
> Jika liveness ikut memeriksa database, maka saat database down **semua** pod gagal liveness dan di-restart bersamaan, berulang kali. Restart tidak memperbaiki database, tetapi menambah beban saat database pulih karena semua instans start bersamaan dan membuka koneksi baru. Liveness sebaiknya hanya memeriksa kondisi internal proses, misalnya deadlock yang tidak bisa pulih.

Untuk readiness, memasukkan dependency eksternal pun perlu pertimbangan: jika semua pod tidak siap karena database down, Service tidak punya endpoint dan pengguna mendapat error koneksi, bukan respons 503 yang informatif. Sering kali lebih baik aplikasi tetap siap dan merespons error yang jelas untuk fitur yang terdampak.

## Mengubah state dari kode

```java
@Component
class CatalogWarmup {
  private final ApplicationEventPublisher events;

  CatalogWarmup(ApplicationEventPublisher events) {
    this.events = events;
  }

  void reload() {
    AvailabilityChangeEvent.publish(events, this, ReadinessState.REFUSING_TRAFFIC);
    // ... muat ulang cache besar ...
    AvailabilityChangeEvent.publish(events, this, ReadinessState.ACCEPTING_TRAFFIC);
  }
}
```
