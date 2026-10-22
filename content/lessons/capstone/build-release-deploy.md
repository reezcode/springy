## Build once, deploy many

Prinsip terpenting dalam rilis: **image yang diuji adalah image yang dijalankan di produksi**. Jangan membangun ulang untuk setiap lingkungan, karena build ulang bisa menghasilkan isi berbeda (dependency berubah, base image diperbarui).

```text
commit ──► test ──► build image ──► push (tag: 1.4.0 / sha) ──► staging ──► produksi
                                         │                       ▲            ▲
                                         └──── image yang SAMA ──┴────────────┘
                                            konfigurasi berbeda per lingkungan
```

## Pipeline minimal

```shell
# 1. Test lebih dulu; berhenti jika gagal
./mvnw -B verify

# 2. Build image dengan tag yang bisa dilacak
VERSION=$(git rev-parse --short HEAD)
docker build -t registry.example.com/shop/order:$VERSION .

# 3. Push
docker push registry.example.com/shop/order:$VERSION

# 4. Deploy (contoh OpenShift)
oc set image deployment/order order=registry.example.com/shop/order:$VERSION
oc rollout status deployment/order --timeout=180s

# 5. Smoke test
curl -sf https://$(oc get route order -o jsonpath='{.spec.host}')/actuator/health
```

Di CI (GitHub Actions, GitLab CI, Tekton/OpenShift Pipelines), setiap langkah menjadi job. Langkah deploy produksi biasanya membutuhkan persetujuan manual.

## Konfigurasi per lingkungan

| Hal | Di image? | Sumber |
| --- | --- | --- |
| Kode aplikasi dan dependency | Ya | Build |
| Port default, nilai aman | Ya | `application.yml` |
| URL database, URL service lain | Tidak | ConfigMap / env |
| Password, token, kunci | **Tidak pernah** | Secret |
| Ukuran heap, jumlah replica | Tidak | Manifest deployment |

## Rollout dan rollback

Tulis langkah ini **sebelum** dibutuhkan:

```text
Rollout
1. Pastikan migrasi baru kompatibel dengan versi aplikasi sebelumnya.
2. oc set image ... (atau oc apply -f manifests/)
3. oc rollout status deployment/order
4. Cek /actuator/health, error rate, dan latensi selama 10 menit.

Rollback
1. oc rollout undo deployment/order
2. oc rollout status deployment/order
3. Verifikasi health.
4. Migrasi database TIDAK ikut kembali: pastikan schema tetap cocok untuk versi lama.
```

> [!WARNING] Migrasi dan rollback
> Jika versi baru menjalankan migrasi yang menghapus kolom yang masih dibaca versi lama, rollback aplikasi akan gagal. Pisahkan perubahan schema yang merusak ke rilis berikutnya (expand and contract dari modul Data).

## Menjalankan di dua lingkungan

Untuk capstone, cukup buktikan image yang sama berjalan di:

1. **Lokal dengan Compose**: `compose.yaml` memakai tag image hasil build, konfigurasi lewat environment.
2. **Sandbox OpenShift** (opsional): image yang sama di-push ke registry, konfigurasi lewat ConfigMap dan Secret, diekspos dengan Route edge.

Bandingkan digest image di kedua lingkungan untuk membuktikan isinya identik.
