## Authentication vs authorization

- **Authentication**: membuktikan *siapa* yang memanggil.
- **Authorization**: memutuskan apa yang *boleh* dilakukan pemanggil itu.

Pada arsitektur OAuth 2.0, ada pembagian peran:

```text
Klien ──(login)──► Authorization server (Keycloak, Auth0, Entra ID, ...)
  │                       │
  │◄────── access token (JWT) ──┘
  │
  └──(Authorization: Bearer <token>)──► Resource server (API kita)
```

API kita adalah **resource server**: ia tidak mengurus login atau password, cukup memverifikasi token dan menegakkan izin.

## Struktur JWT

JWT terdiri dari tiga bagian yang dipisah titik: `header.payload.signature`. Payload berisi *claims*, misalnya:

```json
{
  "iss": "https://auth.example.com/realms/shop",
  "sub": "user-123",
  "aud": "order-api",
  "exp": 1793000000,
  "scope": "orders:read orders:write"
}
```

> [!WARNING] Decode bukan verifikasi
> Header dan payload hanya di-encode Base64URL, bukan dienkripsi. Siapa pun bisa membuat JWT dengan `sub` apa saja. Token baru dapat dipercaya setelah **signature** diverifikasi dengan kunci publik issuer, dan claim `iss`, `exp`, serta `aud` diperiksa. Jangan menulis verifier sendiri.

## Mengaktifkan resource server

Tambahkan `spring-boot-starter-oauth2-resource-server`, lalu tunjuk issuer:

```yaml title="application.yml"
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com/realms/shop
          audiences: order-api
```

Dari `issuer-uri`, Spring Security menemukan endpoint JWKS untuk mengambil kunci publik, lalu memverifikasi signature, issuer, dan masa berlaku setiap token. Konfigurasi `audiences` menambahkan validasi claim `aud`.

## Aturan akses

```java title="SecurityConfig.java"
@Configuration
@EnableWebSecurity
class SecurityConfig {
  @Bean
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/orders/**").hasAuthority("SCOPE_orders:read")
            .requestMatchers(HttpMethod.POST, "/orders").hasAuthority("SCOPE_orders:write")
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));
    return http.build();
  }
}
```

Secara default, setiap scope di claim `scope`/`scp` menjadi authority dengan awalan `SCOPE_`. Aturan dievaluasi dari atas ke bawah, jadi tulis aturan yang spesifik terlebih dahulu dan `anyRequest()` di akhir.

| Kondisi | Status |
| --- | --- |
| Tanpa header Authorization | 401 + header `WWW-Authenticate: Bearer` |
| Token kedaluwarsa / signature salah | 401 |
| Token valid, scope kurang | 403 |
| Token valid, scope sesuai | Diteruskan ke controller |

## Mengakses identitas di controller

```java
@PostMapping("/orders")
ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request,
                                     @AuthenticationPrincipal Jwt jwt) {
  var order = service.create(request, jwt.getSubject());
  // ...
}
```

> [!NOTE] Hal-hal yang sering disalahpahami
> - **CORS bukan authorization.** CORS hanya mengatur browser mana yang boleh membaca response; `curl` dan service lain mengabaikannya.
> - **CSRF** relevan untuk authentication berbasis cookie. API stateless dengan bearer token umumnya tidak memerlukan proteksi CSRF.
> - **Authorization data** tetap tanggung jawab service. Scope `orders:read` tidak otomatis berarti boleh membaca order milik pengguna lain.
