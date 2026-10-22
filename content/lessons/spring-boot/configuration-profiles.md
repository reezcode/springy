## Externalized configuration

Prinsip *build once, run anywhere*: JAR yang sama dijalankan di laptop, staging, dan produksi. Yang berbeda hanyalah konfigurasinya, misalnya URL database, port, atau timeout. Spring Boot mengumpulkan konfigurasi dari banyak **property source** dan menggabungkannya.

```yaml title="src/main/resources/application.yml"
server:
  port: 8080
inventory:
  base-url: http://localhost:8081
  timeout: 2s
```

## Urutan prioritas

Jika properti yang sama didefinisikan di beberapa tempat, sumber dengan prioritas lebih tinggi menang. Urutan yang disederhanakan, dari tertinggi:

1. Argumen command line: `--server.port=7070`
2. Environment variable: `SERVER_PORT=9090`
3. File konfigurasi di luar JAR (misalnya `./config/application.yml`)
4. File profile di dalam JAR: `application-{profile}.yml`
5. `application.yml` di dalam JAR

```shell
java -jar app.jar                         # port 8080 dari application.yml
SERVER_PORT=9090 java -jar app.jar        # port 9090
java -jar app.jar --server.port=7070      # port 7070
```

## Relaxed binding

Environment variable tidak boleh mengandung titik atau tanda hubung. Spring memetakannya otomatis: huruf besar, `.` diganti `_`, dan `-` dihapus.

| Properti | Environment variable |
| --- | --- |
| `server.port` | `SERVER_PORT` |
| `spring.datasource.url` | `SPRING_DATASOURCE_URL` |
| `inventory.base-url` | `INVENTORY_BASEURL` |

## Konfigurasi bertipe dengan @ConfigurationProperties

Daripada menyebar `@Value("${inventory.timeout}")` di banyak class, kelompokkan properti dalam satu record:

```java
@ConfigurationProperties(prefix = "inventory")
public record InventoryProperties(String baseUrl, Duration timeout) {}
```

```java
@SpringBootApplication
@ConfigurationPropertiesScan
public class OrderServiceApplication { ... }
```

Kini `InventoryProperties` bisa di-inject ke bean mana pun. Nilai `2s` otomatis dikonversi ke `Duration`, dan kamu bisa menambahkan anotasi validasi (`@NotBlank`, `@Validated`) agar aplikasi gagal start jika konfigurasi salah. Gagal cepat saat start jauh lebih baik daripada gagal saat request pertama.

## Profile

Profile mengelompokkan konfigurasi per lingkungan:

```yaml title="application-dev.yml"
logging:
  level:
    com.example: DEBUG
```

```shell
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

Gunakan profile untuk **perbedaan perilaku** antarlingkungan. Untuk nilai seperti URL dan kredensial, environment variable biasanya lebih sederhana dan cocok dengan container.

> [!WARNING] Rahasia tidak masuk repository
> Jangan commit password, token, atau API key di `application.yml` maupun file profile. Suntikkan lewat environment variable, secret di platform (Kubernetes/OpenShift Secret), atau secret manager. Jika rahasia sempat ter-commit, anggap bocor dan ganti nilainya.
