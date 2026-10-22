## Pod

**Pod** adalah unit terkecil yang dijadwalkan Kubernetes: satu atau beberapa container yang berbagi network namespace (localhost dan IP yang sama) dan volume. Biasanya satu pod berisi satu container aplikasi.

Pod bersifat **sementara**. Ia bisa mati karena node gagal, digusur karena kekurangan resource, atau diganti saat rollout. Pod pengganti mendapat nama dan IP baru. Karena itu kamu jarang membuat pod langsung, melainkan lewat Deployment.

## Deployment

**Deployment** mendeskripsikan keadaan yang diinginkan: image apa, berapa replica, dan konfigurasi apa. Deployment membuat **ReplicaSet**, dan ReplicaSet memastikan jumlah pod yang berjalan selalu sesuai.

```yaml title="deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order
spec:
  replicas: 2
  selector:
    matchLabels:
      app: order
  template:
    metadata:
      labels:
        app: order
    spec:
      containers:
        - name: order
          image: image-registry.openshift-image-registry.svc:5000/belajar/order:0.1
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: prod
```

`selector.matchLabels` harus cocok dengan `template.metadata.labels`. Begitulah ReplicaSet mengenali pod miliknya.

### Rolling update dan rollback

Saat image atau konfigurasi template berubah, Deployment membuat ReplicaSet baru dan menggeser pod secara bertahap. Pod lama baru dihentikan setelah pod baru siap (lulus readiness probe), sehingga tidak ada downtime.

```shell
oc apply -f deployment.yaml
oc set image deployment/order order=image-registry.openshift-image-registry.svc:5000/belajar/order:0.2
oc rollout status deployment/order
oc rollout history deployment/order
oc rollout undo deployment/order        # kembali ke revisi sebelumnya
```

> [!WARNING] Rollback aplikasi tidak membalik migrasi database
> `oc rollout undo` hanya mengganti image dan konfigurasi pod. Jika versi baru sudah menjalankan migrasi Flyway, schema tetap pada versi baru. Itulah alasan migrasi dirancang tetap mendukung versi aplikasi sebelumnya (expand and contract).

## Service

Pemanggil tidak boleh bergantung pada IP pod yang berubah-ubah. **Service** memberi alamat stabil berupa IP virtual dan nama DNS, lalu meneruskan traffic ke pod yang cocok dengan selector **dan** siap (lulus readiness).

```yaml title="service.yaml"
apiVersion: v1
kind: Service
metadata:
  name: order
spec:
  selector:
    app: order
  ports:
    - port: 8080
      targetPort: 8080
```

Di dalam cluster, service lain memanggil `http://order:8080` (dalam project yang sama) atau `http://order.belajar.svc.cluster.local:8080` (lintas project).

Cara cepat tanpa menulis YAML:

```shell
oc create deployment order --image=image-registry.openshift-image-registry.svc:5000/belajar/order:0.1 --replicas=2
oc expose deployment/order --port=8080 --target-port=8080
oc get pods,svc
```

## Konfigurasi dan secret

Jangan memasukkan konfigurasi lingkungan ke image. Gunakan **ConfigMap** untuk konfigurasi biasa dan **Secret** untuk kredensial, lalu inject sebagai environment variable:

```shell
oc create configmap order-config --from-literal=INVENTORY_BASEURL=http://inventory:8080
oc create secret generic order-db --from-literal=SPRING_DATASOURCE_PASSWORD=...
oc set env deployment/order --from=configmap/order-config
oc set env deployment/order --from=secret/order-db
```

Image yang sama kini bisa berjalan di project dev, staging, dan produksi dengan konfigurasi berbeda. Inilah *build once, run anywhere* dari modul Spring Boot.

> [!TIP] Latihan self-healing
> Hapus salah satu pod dengan `oc delete pod <nama>` dan amati `oc get pods -w`. ReplicaSet langsung membuat pod pengganti, dan Service tetap menjawab di alamat yang sama.
