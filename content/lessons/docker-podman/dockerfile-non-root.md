## Dockerfile pertama

```dockerfile title="Dockerfile (versi sederhana)"
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/order-service.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

| Instruksi | Fungsi |
| --- | --- |
| `FROM` | Base image |
| `WORKDIR` | Direktori kerja untuk instruksi berikutnya dan saat runtime |
| `COPY` | Menyalin file dari build context ke image |
| `RUN` | Menjalankan perintah saat build (menghasilkan layer) |
| `USER` | User yang menjalankan instruksi berikutnya dan proses runtime |
| `EXPOSE` | Dokumentasi port yang didengarkan aplikasi |
| `ENTRYPOINT` / `CMD` | Perintah saat container dijalankan |

Versi ini mengharuskan JAR sudah dibangun di host. Hasilnya bergantung pada JDK dan Maven di mesin yang membangun.

## Multi-stage build

**Multi-stage build** memindahkan proses build ke dalam container juga, lalu hanya menyalin hasilnya ke image runtime yang bersih:

```dockerfile title="Dockerfile"
# --- Stage 1: build ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline       # di-cache selama pom.xml tidak berubah
COPY src/ src/
RUN ./mvnw -q package -DskipTests

# --- Stage 2: runtime ---
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Manfaatnya:

- Image akhir tidak membawa Maven, kode sumber, atau JDK lengkap, sehingga lebih kecil dan permukaan serangannya lebih sempit.
- Build sama di semua mesin karena alatnya ada di dalam image build.
- `pom.xml` disalin dan dependency diunduh **sebelum** `src/`, sehingga mengubah kode tidak memaksa unduh ulang semua dependency.

> [!TIP] Urutan instruksi menentukan cache
> Docker memakai ulang layer selama instruksi dan file yang disalin tidak berubah. Begitu satu layer berubah, semua layer setelahnya dibangun ulang. Letakkan hal yang jarang berubah di atas dan yang sering berubah di bawah.

Tambahkan juga `.dockerignore` agar `target/`, `.git/`, dan file IDE tidak ikut terkirim ke build context.

## Jalankan sebagai non-root

Secara default proses di container berjalan sebagai root (UID 0). Jika aplikasi berhasil dibobol, penyerang mendapat root di dalam container, yang memperbesar peluang lolos ke host atau merusak volume.

```dockerfile
USER 10001
```

Pilih UID numerik agar platform seperti Kubernetes bisa memverifikasi bahwa image memang non-root (`runAsNonRoot: true`). Pastikan direktori yang perlu ditulis aplikasi (misalnya `/tmp`) bisa ditulis oleh user tersebut.

```shell
docker run --rm order-service:0.1 id
# uid=10001 gid=0(root) groups=0(root)
```

## Bentuk exec untuk ENTRYPOINT

```dockerfile
ENTRYPOINT ["java", "-jar", "/app/app.jar"]     # exec form: java menjadi PID 1
ENTRYPOINT java -jar /app/app.jar               # shell form: /bin/sh -c menjadi PID 1
```

Dengan shell form, sinyal `SIGTERM` dari `docker stop` atau Kubernetes dikirim ke shell, bukan ke JVM. Aplikasi tidak menjalankan graceful shutdown dan akhirnya dibunuh paksa setelah batas waktu.

## EXPOSE bukan publish

`EXPOSE 8080` hanya mendokumentasikan port. Untuk mengakses dari host, port harus dipublikasikan saat `run`:

```shell
docker run --rm -p 127.0.0.1:8080:8080 order-service:0.1
#                 └ host ┘   └container┘
```

Menulis `127.0.0.1:` membuat port hanya terbuka untuk mesinmu sendiri, bukan seluruh jaringan.

> [!NOTE] Layered JAR
> Spring Boot bisa mengekstrak JAR menjadi beberapa layer (dependencies, spring-boot-loader, snapshot-dependencies, application) dengan `java -Djarmode=tools -jar app.jar extract --layers`. Layer dependencies jarang berubah sehingga push dan pull image setelah perubahan kode kecil menjadi jauh lebih ringan. Lihat dokumentasi Dockerfiles Spring Boot untuk contoh lengkapnya.
