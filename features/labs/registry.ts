import type { LucideIcon } from 'lucide-react';
import { Activity, Box, Braces, Shapes } from 'lucide-react';

/** Lab metadata. Components are mapped in app/playground/[lab]/page.tsx to keep this file server-safe. */
export const labs: { slug: 'api' | 'solid' | 'breaker' | 'container'; title: string; summary: string; icon: LucideIcon; module: string }[] = [
  { slug: 'api', title: 'REST API & idempotency', summary: 'Kirim request ke API order simulasi: validasi, 401, 404, replay, dan conflict.', icon: Braces, module: 'rest-api' },
  { slug: 'solid', title: 'SOLID & strategy', summary: 'Ganti discount policy dan payment gateway tanpa mengubah alur Checkout.', icon: Shapes, module: 'solid' },
  { slug: 'breaker', title: 'Circuit breaker', summary: 'Ikuti siklus CLOSED → OPEN → HALF_OPEN dengan waktu virtual.', icon: Activity, module: 'resilience-messaging' },
  { slug: 'container', title: 'Container builder', summary: 'Susun perintah docker/podman run yang aman dan pahami tiap flag.', icon: Box, module: 'docker-podman' },
];
