## Masalah yang diselesaikan container

"Di laptop saya jalan" terjadi karena aplikasi bergantung pada banyak hal di luar kodenya: versi JDK, library sistem, variabel environment, struktur folder. **Container** membungkus aplikasi beserta semua kebutuhannya menjadi satu paket yang berjalan sama di laptop, CI, dan server.

## Image

**Image** adalah paket read-only berisi filesystem (OS dasar, JRE, aplikasi) dan metadata (perintah default, port, environment). Image tersusun dari **layer**: setiap instruksi Dockerfile yang mengubah filesystem menghasilkan satu layer.

```text
┌──────────────────────────────┐
│ app.jar                      │  ← layer aplikasi (sering berubah)
├──────────────────────────────┤
│ Eclipse Temurin JRE 21       │  ← layer runtime
├──────────────────────────────┤
│ Ubuntu base                  │  ← layer OS (jarang berubah)
└──────────────────────────────┘
```

Layer bersifat immutable dan dipakai bersama. Sepuluh image yang memakai base JRE yang sama hanya menyimpan layer JRE sekali. Saat build ulang, layer yang tidak berubah diambil dari **cache**.

```shell
docker history order-service:0.1     # lihat layer dan ukurannya
```

## Container

**Container** adalah proses yang dijalankan dari image, ditambah layer tulis tipis miliknya sendiri. Container bukan virtual machine: ia berbagi kernel host dan diisolasi menggunakan fitur kernel Linux.

| Fitur kernel | Mengisolasi |
| --- | --- |
| Namespaces | Apa yang terlihat: proses, network, filesystem mount, hostname, user |
| cgroups | Berapa yang boleh dipakai: CPU, memori, I/O |

Karena itu container start dalam hitungan detik dan ringan dibanding VM.

```shell
docker run --rm -d --name order-lab -p 127.0.0.1:8080:8080 order-service:0.1
docker ps
docker stop order-lab
```

> [!NOTE] Data di container bersifat sementara
> File yang ditulis ke layer container hilang saat container dihapus. Data yang harus bertahan, seperti isi database, disimpan di **volume** (materi 3).

## Registry, tag, dan digest

**Registry** menyimpan dan mendistribusikan image: Docker Hub, Quay.io, GitHub Container Registry, atau registry internal perusahaan/OpenShift. Nama image lengkap:

```text
registry.example.com/team/order-service:0.1
└──── registry ────┘ └─ repository ─┘ └tag┘
```

| Referensi | Sifat |
| --- | --- |
| Tag `:0.1`, `:latest` | Label yang **bisa dipindahkan** ke image lain |
| Digest `@sha256:3f1c…` | Hash isi image, **tidak bisa berubah** |

> [!WARNING] latest bukan "terbaru"
> `latest` hanyalah tag default jika kamu tidak menulis tag. Ia tidak otomatis menunjuk build terbaru, dan dua server yang menarik `:latest` di waktu berbeda bisa mendapat isi berbeda. Gunakan tag versi yang jelas untuk rilis, dan digest jika butuh kepastian mutlak.

```shell
docker tag order-service:0.1 registry.example.com/team/order-service:0.1
docker push registry.example.com/team/order-service:0.1
docker inspect --format '{{index .RepoDigests 0}}' registry.example.com/team/order-service:0.1
```

## OCI: standar bersama

Docker dan Podman (serta Kubernetes/OpenShift) memakai format image dan runtime yang distandarkan oleh **Open Container Initiative (OCI)**. Image yang dibangun dengan Docker bisa dijalankan dengan Podman dan sebaliknya.

> [!TIP] Buildpacks tanpa Dockerfile
> Spring Boot juga bisa membangun image tanpa Dockerfile lewat Cloud Native Buildpacks: `./mvnw spring-boot:build-image`. Hasilnya image OCI yang sudah memakai praktik baik seperti layering dan user non-root.
