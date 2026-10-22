## Membuka aplikasi ke luar cluster

Service hanya bisa diakses dari dalam cluster. Untuk pengguna di luar, OpenShift menyediakan **Route**: resource yang memetakan hostname publik ke sebuah Service melalui **router** (HAProxy-based Ingress Controller) cluster.

```text
Pengguna ──HTTPS──► Router OpenShift ──► Service order ──► pod order (8080)
                     (Route: order-belajar.apps.cluster.example.com)
```

> [!NOTE] Route, Ingress, dan Gateway API
> Di Kubernetes biasa, peran ini dipegang Ingress atau Gateway API. OpenShift juga mendukung Ingress (dan otomatis mengubahnya menjadi Route), tetapi Route adalah cara yang paling umum dan paling lengkap di OpenShift.

## Membuat Route

```shell
oc create route edge order --service=order --port=8080
oc get route order
# NAME    HOST/PORT                                   SERVICES   PORT   TERMINATION
# order   order-belajar.apps.cluster.example.com      order      8080   edge
```

Jika hostname tidak ditentukan, OpenShift membuatnya dari nama route, nama project, dan domain aplikasi cluster.

```yaml title="route.yaml"
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: order
spec:
  to:
    kind: Service
    name: order
  port:
    targetPort: 8080
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

`insecureEdgeTerminationPolicy: Redirect` mengalihkan request HTTP ke HTTPS.

## Jenis terminasi TLS

| Terminasi | TLS pengguna → router | Router → pod | Sertifikat di pod? |
| --- | --- | --- | --- |
| **edge** | Ya, berakhir di router | HTTP biasa | Tidak |
| **passthrough** | Diteruskan apa adanya | TLS sampai pod | Ya, pod menangani TLS |
| **re-encrypt** | Ya, berakhir di router | TLS baru ke pod | Ya |

Edge paling sederhana dan cukup untuk latihan. Untuk lingkungan yang mensyaratkan enkripsi di dalam jaringan cluster, pilih re-encrypt (OpenShift bisa menerbitkan sertifikat service otomatis) atau passthrough.

> [!WARNING] Hati-hati dengan informasi proxy
> Di belakang router, aplikasi menerima request HTTP dari router, bukan langsung dari pengguna. Agar URL yang dibuat aplikasi (misalnya header `Location`) memakai `https` dan host publik, aktifkan `server.forward-headers-strategy=framework` di Spring Boot sehingga header `X-Forwarded-*` dihormati.

## Troubleshooting Route

| Gejala | Kemungkinan penyebab | Periksa |
| --- | --- | --- |
| 503 "Application is not available" | Tidak ada pod siap di belakang Service | `oc get pods`, readiness probe, `oc describe svc order` |
| 503 walau pod Running | `targetPort` Route tidak cocok dengan port Service | `oc get route order -o yaml` |
| Service tanpa endpoint | Selector Service tidak cocok dengan label pod | `oc get endpoints order`, `oc get pods --show-labels` |
| Timeout | Aplikasi lambat; timeout router default 30 detik | Log aplikasi, anotasi `haproxy.router.openshift.io/timeout` |

```shell
oc get endpoints order      # harus berisi IP pod
curl -sk https://$(oc get route order -o jsonpath='{.spec.host}')/actuator/health
```
