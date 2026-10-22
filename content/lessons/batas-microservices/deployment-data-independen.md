## Apa arti "independen"?

Sebuah service benar-benar independen jika tim bisa **merilis versi baru kapan saja tanpa berkoordinasi dengan tim lain**. Itu hanya mungkin jika:

1. Kontrak (API dan event) tetap kompatibel dengan konsumen yang sedang berjalan.
2. Datanya hanya dimiliki service itu.
3. Proses build dan deploy-nya terpisah.

Jika rilis Order selalu harus dibarengi rilis Inventory, kamu punya satu sistem yang dipaksa menjadi dua deployment.

## Kompatibilitas mundur

Saat Inventory merilis versi baru, Order versi lama masih berjalan. Selama rolling update, bahkan dua versi Inventory berjalan bersamaan. Karena itu setiap perubahan kontrak harus aman untuk konsumen lama.

| Aman (additive) | Butuh transisi (breaking) |
| --- | --- |
| Tambah endpoint | Hapus/rename endpoint |
| Tambah field response | Hapus/rename field response |
| Tambah field request opsional | Field request menjadi wajib |
| Tambah jenis event baru | Ubah arti field event |

### Expand and contract

Untuk perubahan breaking, lakukan bertahap dan rilis setiap langkah secara terpisah:

```text
1. Expand   : Inventory mengirim "qty" DAN "available"
2. Migrate  : Order membaca "available"
3. Verify   : log/metrik memastikan tidak ada yang membaca "qty"
4. Contract : Inventory berhenti mengirim "qty"
```

## Contract test

Bagaimana Inventory tahu perubahan mana yang merusak Order? **Consumer-driven contract testing** (misalnya dengan Pact atau Spring Cloud Contract) membalik arah: konsumen menuliskan ekspektasinya sebagai kontrak, dan pipeline penyedia memverifikasi kontrak itu sebelum rilis. Perubahan yang merusak konsumen gagal di CI, bukan di produksi.

## Database per service, secara realistis

"Database per service" tidak harus berarti satu server PostgreSQL per service. Pilihannya berupa spektrum:

| Opsi | Isolasi | Biaya |
| --- | --- | --- |
| Server database terpisah per service | Tertinggi | Tinggi |
| Satu server, **schema dan user terpisah** | Baik, ditegakkan hak akses | Rendah |
| Satu schema, tabel "milik" service berbeda | Hanya konvensi | Rendah, rawan coupling |

Untuk latihan, opsi kedua sudah cukup asalkan ditegakkan oleh database:

```sql
create schema orders;
create schema inventory;

create user order_svc with password '...';
create user inventory_svc with password '...';

grant usage, create on schema orders to order_svc;
grant usage, create on schema inventory to inventory_svc;
-- order_svc tidak punya hak apa pun di schema inventory
```

> [!WARNING] Laporan lintas service
> Kebutuhan laporan yang menggabungkan data Order dan Inventory sering menjadi alasan "sementara" untuk query lintas schema. Lebih baik bangun read model khusus laporan yang diisi dari event kedua service, atau gunakan data warehouse.

## Dokumentasikan kontrak

README setiap service sebaiknya menjawab:

- API apa yang disediakan dan dipakai, beserta versinya.
- Event apa yang diterbitkan dan dikonsumsi, beserta skemanya.
- Data apa yang dimiliki dan siapa yang boleh mengaksesnya.
- Cara menjalankan service secara lokal tanpa service lain (misalnya dengan stub).
