## Kontrak lebih dari sekadar happy path

Kontrak API adalah janji kepada klien. Ia mencakup:

- Method dan path.
- Bentuk body request beserta aturan validasinya.
- Status code dan bentuk body untuk **setiap** hasil, termasuk gagal.
- Header penting seperti `Location`, `Content-Type`, `Idempotency-Key`.

Dokumentasi yang hanya berisi contoh sukses membuat klien menebak-nebak perilaku saat gagal. Tebakan yang salah berujung pada bug di sisi klien.

## Daftar skenario tepi untuk POST /orders

| Skenario | Request | Hasil yang diharapkan |
| --- | --- | --- |
| Valid | `{"product":"Book","quantity":1}` | 201 + `Location` |
| Field wajib kosong | `{"product":"","quantity":1}` | 400, `errors[0].field = product` |
| Angka di luar rentang | `{"product":"Book","quantity":0}` | 400 |
| JSON rusak | `{"product":` | 400 |
| Content-Type salah | `text/plain` | 415 |
| Tanpa token | — | 401 |
| ID tidak ada (GET) | `/orders/999` | 404 |

## Koleksi curl yang bisa diulang

Simpan contoh seperti ini di README atau folder `http/`. Orang lain, termasuk dirimu enam bulan lagi, bisa memverifikasi perilaku dengan cepat.

```shell
BASE=http://localhost:8080

# 201 Created
curl -i -X POST $BASE/orders -H 'Content-Type: application/json' \
  -d '{"product":"Book","quantity":1}'

# 400 validasi
curl -i -X POST $BASE/orders -H 'Content-Type: application/json' \
  -d '{"product":"","quantity":0}'

# 400 JSON rusak
curl -i -X POST $BASE/orders -H 'Content-Type: application/json' \
  -d '{"product":'

# 404
curl -i $BASE/orders/999
```

> [!TIP] Dari curl ke test otomatis
> Setiap baris di koleksi ini kelak menjadi test HTTP dengan MockMvc di modul Testing. Dokumentasi yang bisa dijalankan tidak akan basi diam-diam.

## Breaking change

Perubahan yang membuat klien lama gagal disebut **breaking change**:

| Perubahan | Breaking? |
| --- | --- |
| Menambah field opsional di response | Umumnya tidak |
| Menambah endpoint baru | Tidak |
| Menambah field opsional di request | Tidak |
| Mengganti nama/menghapus field response | **Ya** |
| Membuat field request yang opsional menjadi wajib | **Ya** |
| Mengubah tipe field (`"42"` → `42`) | **Ya** |
| Mengubah arti status code | **Ya** |

Ketika breaking change tidak bisa dihindari, pilih strategi transisi: dukung field lama dan baru sementara waktu, atau terbitkan versi baru (`/v2/orders` atau header versi) dan beri masa deprecation.

> [!NOTE] Klien yang toleran
> Klien sebaiknya mengabaikan field yang tidak dikenalnya (prinsip *tolerant reader*). Di Spring, Jackson secara default sudah dikonfigurasi Spring Boot untuk tidak gagal pada properti tak dikenal saat deserialisasi.

## Dokumentasi otomatis

Untuk API yang lebih besar, pertimbangkan spesifikasi **OpenAPI**. Library seperti springdoc-openapi dapat menghasilkan spesifikasi dari controller dan menampilkan Swagger UI. Spesifikasi tetap perlu dilengkapi contoh error, karena generator hanya tahu yang kamu deklarasikan.
