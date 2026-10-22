## Menyiapkan JDK

Spring Boot 3.x membutuhkan minimal **Java 17**. Jalur ini memakai **Java 21**, versi LTS dengan fitur seperti record, pattern matching, dan virtual thread. Distribusi seperti Eclipse Temurin bisa dipasang lewat package manager atau SDKMAN.

```shell
java -version
# openjdk version "21.0.x" ...
```

> [!NOTE] Spring Boot 3 atau 4?
> Contoh di jalur ini memakai gaya Spring Boot 3.x yang paling banyak dipakai. Jika kamu memilih rilis yang lebih baru, cek halaman *System Requirements* dan catatan migrasinya. Jangan mencampur contoh dari dua versi mayor tanpa memeriksa perbedaannya.

## Membuat project dengan Spring Initializr

Buka [start.spring.io](https://start.spring.io) dan pilih:

- **Project:** Maven
- **Language:** Java
- **Spring Boot:** rilis stabil terbaru (bukan SNAPSHOT/M/RC)
- **Group / Artifact:** misalnya `com.example` / `order-service`
- **Java:** 21
- **Dependencies:** Spring Web, Validation, Spring Boot Actuator

Unduh, ekstrak, lalu buka di IDE.

## Struktur project

```text
order-service/
├── mvnw, mvnw.cmd            ← Maven Wrapper
├── .mvn/wrapper/             ← versi Maven yang dikunci
├── pom.xml                   ← dependency dan plugin
└── src/
    ├── main/java/com/example/orderservice/
    │   └── OrderServiceApplication.java
    ├── main/resources/
    │   └── application.properties
    └── test/java/...         ← test
```

`pom.xml` mewarisi `spring-boot-starter-parent`, yang menyediakan versi dependency yang sudah diuji bersama. Karena itu kamu jarang perlu menulis nomor versi untuk dependency Spring.

```xml title="pom.xml (cuplikan)"
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

**Starter** adalah kumpulan dependency yang biasa dipakai bersama. `spring-boot-starter-web` membawa Spring MVC, Jackson untuk JSON, dan server Tomcat embedded.

## Class utama

```java title="OrderServiceApplication.java"
@SpringBootApplication
public class OrderServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(OrderServiceApplication.class, args);
  }
}
```

`@SpringBootApplication` menggabungkan tiga hal:

1. `@Configuration`: class ini boleh mendefinisikan bean.
2. `@EnableAutoConfiguration`: Spring Boot mengonfigurasi komponen berdasarkan dependency yang ada di classpath.
3. `@ComponentScan`: mencari class beranotasi di package ini dan sub-package-nya.

> [!WARNING] Letak class utama
> Simpan class utama di package teratas (`com.example.orderservice`). Component di luar package itu tidak akan ditemukan oleh component scan.

## Maven Wrapper dan lifecycle

Gunakan `./mvnw` (atau `mvnw.cmd` di Windows), bukan `mvn` global. Wrapper mengunduh versi Maven yang tercatat di project sehingga build sama di laptop, rekan kerja, dan CI.

```shell
./mvnw test               # compile + jalankan test
./mvnw spring-boot:run    # jalankan aplikasi
./mvnw package            # hasilkan target/order-service-0.0.1-SNAPSHOT.jar
java -jar target/*.jar    # jalankan JAR
```

Maven bekerja dengan **lifecycle**. Menjalankan satu fase juga menjalankan semua fase sebelumnya:

| Fase | Yang terjadi |
| --- | --- |
| `validate` | Memeriksa struktur project |
| `compile` | Mengompilasi kode sumber |
| `test` | Menjalankan unit test |
| `package` | Membuat JAR |
| `verify` | Menjalankan pemeriksaan tambahan, misalnya integration test |
| `install` | Menyalin artefak ke repository lokal `~/.m2` |

Setelah aplikasi berjalan, buka `http://localhost:8080/actuator/health`. Jawaban `{"status":"UP"}` berarti aplikasi siap.
