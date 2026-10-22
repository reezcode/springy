## Keamanan default yang ketat

Docker dan Podman mengizinkan container berjalan sebagai root kecuali kamu melarangnya. OpenShift membalik default ini. Lewat **Security Context Constraints (SCC)**, pod biasa berjalan dengan SCC `restricted-v2`, yang antara lain:

- Menjalankan container dengan **UID acak** dari rentang yang dialokasikan untuk project (misalnya `1000680000`), mengabaikan instruksi `USER` di Dockerfile.
- Menjadikan proses anggota **group root (GID 0)**.
- Melarang privilege escalation dan menghapus capability Linux yang tidak dibutuhkan.

Image yang mengasumsikan berjalan sebagai root atau sebagai UID tertentu akan gagal dengan `Permission denied` saat menulis file.

## Image yang mendukung arbitrary UID

Kuncinya: karena UID tidak bisa ditebak tetapi GID selalu 0, berikan izin melalui **group**.

```dockerfile title="Dockerfile"
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
RUN mkdir -p /app/data && \
    chgrp -R 0 /app/data && \
    chmod -R g=u /app/data
USER 1001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

- `chgrp -R 0` menjadikan group root pemilik direktori.
- `chmod -R g=u` memberi group izin yang sama dengan owner.
- `USER 1001` membuat image tetap non-root saat dijalankan di luar OpenShift.

Uji secara lokal dengan UID yang tidak terduga:

```shell
podman run --rm --user 123456:0 -p 127.0.0.1:8080:8080 localhost/order-service:0.1
```

Jika aplikasi start dan bisa menulis ke direktori yang dibutuhkan, image siap untuk OpenShift.

> [!WARNING] Jangan longgarkan SCC untuk menutupi masalah image
> Meminta admin memberi service account SCC `anyuid` atau `privileged` memang membuat error hilang, tetapi juga melemahkan isolasi cluster untuk semua yang memakai service account itu. Perbaiki image-nya. Aplikasi web Spring Boot tidak butuh root.

## Resource request dan limit

Setiap container sebaiknya mendeklarasikan kebutuhan CPU dan memorinya:

```yaml
resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    memory: 768Mi
```

| | Request | Limit |
| --- | --- | --- |
| Fungsi | Jaminan minimum; dipakai scheduler untuk memilih node | Batas maksimum pemakaian |
| CPU melebihi | — | Diperlambat (*throttled*) |
| Memori melebihi | — | Container dibunuh: **OOMKilled** |

Banyak project OpenShift memiliki **LimitRange** dan **ResourceQuota**: nilai default jika kamu tidak menulis resources, dan total maksimum untuk seluruh project.

## JVM di dalam container

JVM modern (Java 10+) membaca limit memori container. Secara default heap maksimum hanya 25% dari limit, yang sering terlalu kecil untuk aplikasi Spring Boot. Atur proporsinya:

```yaml
env:
  - name: JAVA_TOOL_OPTIONS
    value: "-XX:MaxRAMPercentage=75"
```

Jangan set 100%: JVM juga butuh memori di luar heap untuk metaspace, thread stack, code cache, dan buffer langsung. Jika pod sering OOMKilled, ukur pemakaian sebenarnya (metrics `jvm.memory.used` dari Actuator) sebelum menaikkan limit.

> [!TIP] Checklist sebelum produksi
> - Image non-root dan lolos uji arbitrary UID.
> - Resource request/limit realistis dan heap disesuaikan.
> - Startup, readiness, dan liveness probe dikonfigurasi (modul Observability).
> - Konfigurasi dari ConfigMap, secret dari Secret.
> - Lebih dari satu replica dan graceful shutdown aktif (`server.shutdown=graceful`).
