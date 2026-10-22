## Skema juga butuh version control

Kode aplikasi disimpan di Git dengan riwayat yang jelas. Skema database butuh hal yang sama: setiap perubahan dicatat, berurutan, dan bisa diterapkan ke database mana pun untuk membawanya ke versi yang sama. Inilah fungsi alat migrasi seperti **Flyway** atau **Liquibase**.

## Flyway di Spring Boot

Tambahkan `org.flywaydb:flyway-core` (dan modul database, misalnya `flyway-database-postgresql`). Saat start, Spring Boot menjalankan migrasi dari `src/main/resources/db/migration` sebelum aplikasi melayani request.

```text
src/main/resources/db/migration/
├── V1__create_orders.sql
├── V2__add_order_status.sql
└── V3__create_order_items.sql
```

Konvensi nama: `V` + versi + **dua underscore** + deskripsi + `.sql`.

```sql title="V1__create_orders.sql"
create table orders (
  id        bigint generated always as identity primary key,
  product   varchar(100) not null,
  quantity  integer      not null check (quantity > 0)
);
```

Flyway mencatat migrasi yang sudah dijalankan beserta checksum-nya di tabel `flyway_schema_history`. Pada start berikutnya, hanya migrasi baru yang dijalankan.

> [!WARNING] Jangan ubah migrasi yang sudah berjalan
> Mengedit `V1__...sql` setelah dijalankan di database lain membuat checksum tidak cocok dan Flyway menolak start. Perubahan berikutnya selalu ditulis sebagai migrasi baru.

## Biarkan Flyway menjadi pemilik skema

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

| `ddl-auto` | Perilaku | Kapan |
| --- | --- | --- |
| `none` | Tidak melakukan apa-apa | Produksi |
| `validate` | Cek mapping cocok dengan skema, gagal start jika tidak | Produksi dengan migrasi |
| `update` | Mengubah skema diam-diam, tidak pernah menghapus | Hindari |
| `create` / `create-drop` | Membuat ulang skema, data hilang | Eksperimen singkat saja |

`update` terlihat praktis, tetapi tidak meninggalkan riwayat, tidak bisa me-rename kolom, dan perilakunya bisa berbeda antardatabase.

## Migrasi yang aman untuk data yang sudah ada

Menambah kolom wajib ke tabel berisi jutaan baris tidak sesederhana `ADD COLUMN ... NOT NULL`. Lakukan bertahap:

```sql title="V2__add_order_status.sql"
alter table orders add column status varchar(20);
update orders set status = 'NEW' where status is null;
```

```sql title="V3__order_status_not_null.sql"
alter table orders alter column status set default 'NEW';
alter table orders alter column status set not null;
```

Pola ini disebut **expand and contract**: tambahkan struktur baru, pindahkan data dan rilis aplikasi yang memakainya, baru kemudian hapus atau perketat struktur lama. Selama rolling deployment, versi aplikasi lama dan baru berjalan bersamaan, jadi skema harus cocok untuk keduanya.

> [!NOTE] Rollback aplikasi ≠ rollback skema
> Mengembalikan aplikasi ke versi sebelumnya tidak membalik migrasi. Rancang migrasi agar versi aplikasi sebelumnya tetap bisa berjalan di atas skema baru.

## Uji migrasi

Jalankan migrasi pada database kosong **dan** pada salinan database versi sebelumnya. Di modul Testing, kamu akan memakai Testcontainers untuk menjalankan migrasi pada PostgreSQL sungguhan di setiap build.
