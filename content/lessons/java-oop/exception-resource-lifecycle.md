## Alur normal dan alur gagal

Exception memisahkan alur sukses dari alur gagal. Daripada setiap method mengembalikan kode error yang harus diperiksa manual, method melempar exception dan pemanggil yang relevan menanganinya.

```java
try {
  Order order = repository.load(id);
  order.confirm();
} catch (OrderNotFoundException e) {
  System.out.println("Order " + id + " tidak ada");
}
```

## Checked vs unchecked

| Jenis | Turunan dari | Wajib ditangani? | Contoh |
| --- | --- | --- | --- |
| Checked | `Exception` (bukan `RuntimeException`) | Ya, `catch` atau `throws` | `IOException`, `SQLException` |
| Unchecked | `RuntimeException` | Tidak | `IllegalArgumentException`, `NullPointerException` |

Checked exception mewakili kondisi di luar kendali program yang wajar diantisipasi, seperti file hilang atau jaringan putus. Unchecked exception biasanya menandakan kesalahan pemakaian atau bug, misalnya argumen tidak valid.

> [!NOTE] Spring dan unchecked exception
> Spring cenderung membungkus error teknis menjadi unchecked exception (misalnya `DataAccessException`). Itu sebabnya kode Spring jarang penuh `throws`. Transaksi Spring juga secara default hanya di-rollback untuk unchecked exception.

## try-with-resources

Resource seperti file, socket, dan koneksi database harus ditutup. Jika lupa, aplikasi kehabisan file handle atau koneksi. Pola lama dengan `finally` panjang dan mudah salah. Sejak Java 7, gunakan **try-with-resources** untuk object yang mengimplementasikan `AutoCloseable`:

```java
String firstLine(Path path) throws IOException {
  try (BufferedReader reader = Files.newBufferedReader(path)) {
    return reader.readLine();
  } // reader.close() dipanggil otomatis, sukses maupun gagal
}
```

Beberapa resource bisa dibuka sekaligus dan akan ditutup dengan urutan terbalik:

```java
try (var in = Files.newInputStream(source);
     var out = Files.newOutputStream(target)) {
  in.transferTo(out);
}
```

## Menangani dengan sengaja

Ada tiga pilihan yang masuk akal ketika menangkap exception:

1. **Pulihkan** jika memang ada jalur alternatif, misalnya memakai nilai default.
2. **Bungkus dan lempar ulang** dengan konteks bisnis yang lebih jelas.
3. **Biarkan naik** ke lapisan yang lebih tahu cara menanganinya.

```java
try {
  return Files.readAllLines(path);
} catch (NoSuchFileException e) {
  throw new CatalogImportException("File katalog tidak ditemukan: " + path, e);
}
```

Perhatikan argumen kedua, `e`. Itu adalah **cause**. Tanpanya, stack trace asli hilang dan debugging jadi tebak-tebakan.

> [!WARNING] Jangan menelan exception
> `catch (Exception e) { }` membuat kegagalan lenyap tanpa jejak. Program lanjut dalam keadaan yang salah dan bug muncul jauh dari penyebabnya. Minimal, log dengan konteks lalu lempar ulang.

## Membuat exception sendiri

Exception khusus domain membuat kode lebih mudah dibaca dan memudahkan pemetaan ke HTTP status di modul REST API:

```java
public class OrderNotFoundException extends RuntimeException {
  public OrderNotFoundException(long id) {
    super("Order " + id + " tidak ditemukan");
  }
}
```

Beri nama berdasarkan *apa yang terjadi* dalam bahasa bisnis, bukan detail teknisnya.
