## Komunikasi antarcontainer lewat network

Setiap container punya network namespace sendiri, termasuk `localhost`-nya sendiri. Agar Order bisa menghubungi PostgreSQL, keduanya harus berada di network yang sama:

```shell
docker network create shop
docker run -d --name db --network shop -e POSTGRES_PASSWORD=secret postgres:16
docker run -d --name order --network shop -p 127.0.0.1:8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/postgres \
  order-service:0.1
```

Di network buatan pengguna, Docker dan Podman menyediakan **DNS internal**: nama container (`db`) bisa dipakai sebagai hostname.

> [!WARNING] localhost di dalam container
> `jdbc:postgresql://localhost:5432` dari dalam container Order merujuk ke container Order itu sendiri, bukan host dan bukan container database. Gunakan nama service.

## Volume untuk data yang harus bertahan

Layer tulis container ikut terhapus bersama container. Untuk database, simpan data di **volume**:

| Jenis | Contoh | Cocok untuk |
| --- | --- | --- |
| Named volume | `-v pgdata:/var/lib/postgresql/data` | Data aplikasi/DB, dikelola runtime |
| Bind mount | `-v ./config:/app/config:ro` | Berbagi file dari host, misalnya konfigurasi |

```shell
docker volume create pgdata
docker run -d --name db --network shop -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret postgres:16
docker rm -f db                                    # container dihapus
docker run -d --name db --network shop -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret postgres:16          # data masih ada
```

## Compose: merangkai beberapa container

Mengetik perintah di atas setiap hari melelahkan dan rawan salah. **Compose** mendeskripsikan semua service, network, dan volume dalam satu file:

```yaml title="compose.yaml"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: orders
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U orders -d orders"]
      interval: 5s
      retries: 10

  order:
    build: .
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/orders
      SPRING_DATASOURCE_USERNAME: orders
      SPRING_DATASOURCE_PASSWORD: secret
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
```

```shell
docker compose up -d --build
docker compose logs -f order
docker compose down            # volume tetap ada
docker compose down -v         # hapus juga volume (data hilang!)
```

Compose otomatis membuat network untuk project sehingga `db` dapat ditemukan oleh `order`.

## depends_on dan healthcheck

| Bentuk | Menunggu |
| --- | --- |
| `depends_on: [db]` | Container `db` **dibuat dan start** |
| `condition: service_healthy` | Healthcheck `db` **berhasil** |

PostgreSQL butuh beberapa detik setelah container start untuk siap menerima koneksi. Tanpa kondisi `service_healthy`, Order bisa mencoba koneksi terlalu cepat dan gagal start.

> [!NOTE] Tangani koneksi yang terputus saat runtime
> `depends_on` hanya berlaku saat Compose memulai stack. Jika database restart di tengah jalan, aplikasi tetap harus menangani koneksi yang terputus (pool koneksi akan mencoba lagi). Di Kubernetes tidak ada `depends_on` sama sekali; readiness probe dan retry yang mengambil peran ini.

> [!TIP] Secret di Compose
> Untuk latihan, password di `compose.yaml` bisa diterima. Untuk berbagi project, pindahkan ke file `.env` yang tidak di-commit, atau gunakan fitur `secrets` Compose.
