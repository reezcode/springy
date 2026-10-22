## Podman dalam satu paragraf

**Podman** adalah container engine dari Red Hat yang kompatibel dengan perintah Docker, tetapi **tanpa daemon**: setiap container adalah proses anak dari perintah `podman` (atau systemd). Podman dirancang untuk berjalan **rootless**, yaitu oleh user biasa tanpa hak root di host. Konsep ini sejalan dengan OpenShift, yang secara default juga menjalankan container tanpa root.

```shell
podman build -t localhost/order-service:0.1 .
podman run --rm -d --name order-lab -p 127.0.0.1:8080:8080 localhost/order-service:0.1
podman ps
podman logs -f order-lab
```

Banyak orang cukup menambahkan `alias docker=podman`.

## Podman di macOS dan Windows

Container Linux butuh kernel Linux. Di macOS dan Windows, Podman menjalankan VM Linux kecil:

```shell
podman machine init      # sekali, membuat VM
podman machine start     # setiap kali akan dipakai
podman machine list
```

Folder home biasanya di-mount ke VM secara otomatis, tetapi path dan performa bind mount bisa berbeda dari Linux.

## Nama image yang lengkap

Podman tidak otomatis menganggap semua nama pendek berasal dari Docker Hub. Untuk menghindari prompt atau image yang salah, tulis nama lengkap:

| Pendek | Lengkap |
| --- | --- |
| `postgres:16` | `docker.io/library/postgres:16` |
| `order-service:0.1` (lokal) | `localhost/order-service:0.1` |

## Rootless dan pemetaan UID

Pada mode rootless, Podman memakai **user namespace**: UID 0 (root) di dalam container dipetakan ke UID user-mu di host, dan UID lain dipetakan ke rentang *subordinate UID* milikmu (lihat `/etc/subuid`).

```text
Di dalam container        Di host
UID 0     (root)    →     UID 1000 (kamu)
UID 10001           →     UID 110000 (subuid)
```

Akibatnya, proses `root` di container tidak punya hak root di host, tetapi muncul masalah izin pada bind mount: file di host milik UID 1000, sedangkan aplikasimu berjalan sebagai UID 10001 di container yang dipetakan ke UID lain di host.

Pilihan perbaikan:

- `--userns=keep-id`: petakan UID-mu di host ke UID yang sama di container.
- `podman unshare chown 10001:0 ./data`: ubah pemilik folder sesuai pemetaan namespace.
- Di sistem dengan SELinux (Fedora, RHEL), tambahkan `:Z` atau `:z` pada volume agar label konteksnya benar: `-v ./data:/data:Z`.

## Panduan diagnosis

| Gejala | Periksa | Perintah |
| --- | --- | --- |
| Container langsung berhenti | Log start dan exit code | `podman ps -a`, `podman logs <nama>` |
| Port tidak bisa diakses dari host | Pemetaan port, alamat listen aplikasi | `podman port <nama>`, `podman exec <nama> curl -s localhost:8080` |
| Konflik nama | Container lama dengan nama sama | `podman rm -f <nama>` |
| Permission denied pada volume | UID proses vs pemilik folder, label SELinux | `podman exec <nama> id`, `ls -ln`, opsi `:Z` |
| Tidak bisa menghubungi container lain | Network yang sama, hostname | `podman network inspect <net>` |
| Konfigurasi tidak terbaca | Environment variable | `podman inspect <nama> --format '{{.Config.Env}}'` |

> [!WARNING] Aplikasi harus listen di 0.0.0.0
> Jika aplikasi hanya listen di `127.0.0.1` di dalam container, trafik yang diteruskan dari host (lewat interface network container) tidak akan sampai. Spring Boot secara default listen di semua interface; pastikan tidak ada `server.address=127.0.0.1` di konfigurasi.

## Pod di Podman

Podman mengenal konsep **pod**, sama seperti Kubernetes: beberapa container berbagi network namespace sehingga bisa saling memanggil lewat `localhost`. `podman generate kube` bahkan bisa menghasilkan YAML Kubernetes dari pod lokal, jembatan yang berguna menuju modul OpenShift.

> [!TIP] Coba di playground
> Lab "Container builder" menyusun perintah `docker`/`podman run` yang aman dan menjelaskan setiap flag-nya.
