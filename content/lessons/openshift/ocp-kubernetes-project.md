## Dari satu host ke cluster

Docker dan Podman menjalankan container di satu mesin. Di produksi, kita butuh lebih: menjalankan banyak replica di banyak mesin, mengganti container yang mati, rolling update tanpa downtime, dan load balancing. Itu tugas **container orchestrator**, dan standar de facto-nya adalah **Kubernetes**.

**OpenShift Container Platform (OCP)** adalah platform Kubernetes dari Red Hat. Semua konsep Kubernetes berlaku, ditambah fitur yang memudahkan developer dan tim operasi:

| Fitur | Keterangan |
| --- | --- |
| Web console | Tampilan Developer dan Administrator |
| Route | Ekspos aplikasi HTTP(S) ke luar cluster dengan mudah |
| Build & ImageStream | Membangun image di dalam cluster (S2I, Dockerfile) dan melacak versinya |
| Integrated registry | Registry image internal |
| Security Context Constraints (SCC) | Kebijakan keamanan pod yang ketat secara default |
| Operator Hub | Memasang dan mengelola layanan seperti database lewat Operator |

> [!NOTE] Dua arti "OCP"
> Di modul SOLID, OCP berarti *Open/Closed Principle*. Di modul ini, OCP berarti *OpenShift Container Platform*. Konteksnya biasanya cukup jelas.

## Gambaran arsitektur

```text
┌──────────────────── Cluster OpenShift ────────────────────┐
│  Control plane: API server, etcd, scheduler, controller   │
│                                                           │
│  Worker node 1          Worker node 2        ...          │
│  ┌─────┐ ┌─────┐        ┌─────┐                           │
│  │ pod │ │ pod │        │ pod │                           │
│  └─────┘ └─────┘        └─────┘                           │
└───────────────────────────────────────────────────────────┘
```

Sebagai developer, kamu berinteraksi dengan **API server**: mengirim deskripsi keadaan yang diinginkan ("saya mau 2 replica image ini"), dan controller di cluster bekerja terus-menerus agar keadaan nyata cocok dengan deskripsi itu. Pendekatan **deklaratif** ini adalah inti Kubernetes.

## Project

**Project** adalah namespace Kubernetes dengan tambahan pengaturan akses. Ia menjadi ruang kerja tim atau aplikasi: nama resource unik per project, hak akses diberikan per project, dan kuota resource bisa dibatasi per project.

```shell
oc login --token=<token> --server=https://api.cluster.example.com:6443
oc projects                         # daftar project yang bisa diakses
oc new-project belajar-microservices
oc project belajar-microservices    # pindah project aktif
```

## oc dan kubectl

`oc` adalah CLI OpenShift. Ia mencakup seluruh perintah `kubectl` ditambah perintah khusus OpenShift.

| Tujuan | Perintah |
| --- | --- |
| Lihat resource utama | `oc get all` |
| Detail dan event sebuah resource | `oc describe deployment/order` |
| Log aplikasi | `oc logs deployment/order` |
| Masuk ke container | `oc rsh deployment/order` |
| Terapkan manifest | `oc apply -f deployment.yaml` |
| Lihat event terbaru project | `oc get events --sort-by=.lastTimestamp` |

> [!TIP] Tempat latihan
> Red Hat menyediakan *Developer Sandbox for OpenShift* gratis dengan batas waktu dan kuota, cukup untuk mengikuti modul ini. Alternatif lokalnya adalah OpenShift Local (dulu CodeReady Containers), yang butuh RAM cukup besar.

## Cakupan modul ini

Modul ini adalah **pengenalan penggunaan**: men-deploy aplikasi, mengeksposnya, dan memahami batasan keamanannya. Instalasi cluster, pengelolaan node, jaringan cluster, dan administrasi Operator adalah topik tersendiri untuk peran platform engineer.
