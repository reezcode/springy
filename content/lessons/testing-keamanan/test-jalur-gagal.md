## Kontrak yang paling mudah rusak

Happy path biasanya teruji karena developer mencobanya setiap hari. Yang sering rusak tanpa disadari adalah jalur gagal: aturan keamanan yang terlalu longgar setelah refactor, exception yang tiba-tiba menjadi 500, atau validasi yang hilang karena `@Valid` terhapus. Klien bergantung pada status ini, jadi semuanya perlu dibuktikan dengan test.

## Slice test lapisan web

`@WebMvcTest` memuat controller, advice, filter security, dan konfigurasi MVC saja, tanpa database. Service diganti dengan mock.

```java title="OrderControllerTest.java"
@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
class OrderControllerTest {

  @Autowired MockMvc mvc;
  @MockitoBean OrderService service;      // Spring Boot 3.4+; versi lama: @MockBean

  @Test
  void rejectsAnonymous() throws Exception {
    mvc.perform(get("/orders/1"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void rejectsMissingScope() throws Exception {
    mvc.perform(post("/orders")
            .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_orders:read")))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"product":"Book","quantity":1}
                """))
        .andExpect(status().isForbidden());
  }

  @Test
  void rejectsInvalidBody() throws Exception {
    mvc.perform(post("/orders")
            .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_orders:write")))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"product":"","quantity":0}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    verifyNoInteractions(service);   // service tidak boleh terpanggil
  }

  @Test
  void returnsProblemDetailWhenNotFound() throws Exception {
    when(service.find(99L)).thenThrow(new OrderNotFoundException(99L));

    mvc.perform(get("/orders/99")
            .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_orders:read"))))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.detail").value("Order 99 tidak ditemukan"));
  }
}
```

`jwt()` dari `SecurityMockMvcRequestPostProcessors` membuat request terautentikasi tanpa authorization server sungguhan, sehingga test tetap cepat dan offline.

## Matriks skenario

Gunakan tabel seperti ini untuk memastikan tidak ada yang terlewat:

| Endpoint | Tanpa token | Scope kurang | Body tidak valid | Tidak ditemukan | Sukses |
| --- | --- | --- | --- | --- | --- |
| `GET /orders/{id}` | 401 | 403 | — | 404 | 200 |
| `POST /orders` | 401 | 403 | 400 | — | 201 |

Setiap sel adalah satu test. Jika suatu hari ada yang mengubah aturan security atau handler error, build langsung gagal.

> [!WARNING] Coverage bukan tujuan
> Coverage 95% hanya berarti 95% baris pernah dijalankan, bukan bahwa perilakunya benar. Test yang memanggil method tanpa assertion yang berarti tetap menaikkan coverage. Ukur dari skenario yang dibuktikan.

## Test sebagai dokumentasi

Test HTTP yang rapi adalah dokumentasi kontrak yang selalu mutakhir. Saat klien bertanya "apa yang terjadi jika quantity 0?", jawabannya ada di test yang lulus di CI.

> [!TIP] Jalankan di CI
> Pastikan `./mvnw verify` berjalan pada setiap pull request. Test yang hanya dijalankan di laptop cepat atau lambat akan diabaikan.
