# Springy

Learn Java, Spring Boot, and microservices through 12 modules, 48 lessons, exercises, and four interactive labs. Indonesian is available at `/`; English is available at `/en/`.

## Run locally

Use Node.js 22.13 or newer and npm. `package-lock.json` is the canonical lockfile.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The ID / EN switch in the sidebar or mobile menu opens the same page in the other language. Progress, practice markers, notes, and theme are shared between languages on the same origin. Browser data does not sync between devices or domains.

## Docker Compose

Docker with Compose v2 is required. No local Node installation or prebuilt `out/` directory is needed: the multi-stage Dockerfile builds both languages from source and serves only static assets with unprivileged Nginx.

```sh
docker compose up --build -d
docker compose ps
docker compose logs -f web
```

Open http://localhost:8080 or http://localhost:8080/en/.

```sh
# Use a different local port.
SPRINGY_PORT=9090 docker compose up --build -d

# Stop the container.
docker compose down

# Rebuild with updated base-image tags.
docker compose build --pull
docker compose up -d
```

The default binding is `127.0.0.1`, intended for local use or a reverse proxy on the same host. `SPRINGY_BIND_ADDRESS` changes it when explicitly needed. For an internet-facing deployment, terminate HTTPS at a trusted reverse proxy and configure HSTS there. Do not publish the development server. See [SECURITY.md](SECURITY.md) for the deployment controls and verification steps.

The runtime uses UID/GID 101, a read-only filesystem, a bounded temporary filesystem, dropped Linux capabilities, no-new-privileges, process/memory/CPU limits, rotated logs, and a healthcheck. No database, server credentials, or Docker socket mounts are required.

For Docker without Compose:

```sh
docker build --pull -t springy:local .
docker run --rm --name springy --read-only --user 101:101 --cap-drop ALL --security-opt no-new-privileges --tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m,mode=1777 -p 127.0.0.1:8080:8080 springy:local
```

Podman can build the same Dockerfile. Use `podman compose` with a compatible Compose provider for `compose.yaml`.

## Build and verify

```sh
npm run check
npm audit

# Browser checks against the production export and its CSP.
# Uses an installed Google Chrome; install Chrome if it is unavailable.
npm run test:browser
```

`npm run check` runs curriculum/grading, localization, and security tests, TypeScript validation, and the production export. `npm run build` writes `out/` and generates `.generated/security-csp.conf` from the exact inline scripts in the HTML. Docker installs this file into Nginx. Rebuild after any HTML change so the CSP hashes match.

For another static host, upload the contents of `out/` and configure equivalent security headers using the generated CSP hashes. Nginx configuration does not automatically apply to other hosting services. `next start` is not used because this app exports static files.

## Project structure

```text
app/(indonesian)/         Shared page source and Indonesian root layout
app/(english)/en/         Generated English routes; do not edit directly
components/              Shared UI, exercises, navigation, progress
content/modules/         Indonesian metadata and exercises
content/lessons/          Indonesian lesson bodies
content/en/modules/      Authored English metadata and exercise wording
content/en/lesson-notes.json  Authored English lesson explanations
content/en/ui.json       English UI messages
features/labs/           Interactive browser simulations
lib/                     Grading, markdown parser, progress validation
scripts/generate-english.mjs  Build-time English generation
scripts/security-headers.mjs  Per-page CSP hashes
.generated/              Generated English sources, lessons, and CSP map
tests/                   Logic, curriculum, localization, and security tests
tests/browser/           Browser navigation, persistence, CSP, and XSS tests
compose.yaml             Local/reverse-proxy deployment
nginx.conf               Production static server and security headers
```

## Editing content and translations

Edit the Indonesian pages and components in their shared source locations. Add matching UI translations to `content/en/ui.json`. English routes and UI are generated before dev, tests, typecheck, and build, so both languages use the same implementation. After changing shared source during an existing dev session, rerun `npm run generate:english` to refresh English files.

English module overlays supply titles, summaries, objectives, key points, practice tasks, prompts, choices, hints, and explanations. English lesson notes are combined with the same code/configuration examples as Indonesian. The examples intentionally keep their original code, string literals, and comments so executable examples and grading requirements remain consistent. Translate the teaching text around them in the English authoring files.

Do not reorder lessons or change exercise IDs: existing progress uses stable keys such as `m1-1:class-vs-object`. English generation preserves lesson IDs, slugs, choice correctness, accepted fill answers, code, and regex checks. Localization tests verify those contracts and all reference solutions.

## Progress and notes

Progress remains in localStorage under the existing `springpath-v2` key so the rename does not discard saved work. Older `springpath-v1` exports can still migrate. JSON import/export is available in Settings. Import accepts at most 2 MB; notes are bounded and displayed as text. Do not store passwords or tokens in learning notes.

## Learning rewards and motion

Springy derives rewards from your existing progress: 20 XP per correct question, 50 XP per completed lesson, and 150 XP per completed module. Eight levels and six badges mark milestones. Repeating a passed question adds no XP. Resetting exercises recalculates XP from the current results instead of keeping a separate farmable score.

The daily quest asks for two new correct answers using your local calendar day. Streaks follow consecutive active days. Rewards are local learning aids, not an authenticated score or competition. Both languages share the same progress.

Tap Springy for a greeting; its eyes follow pointer movement. New achievements show a short, dismissible celebration. The Animations switch in the sidebar or Settings enables calm mode and saves the preference. Device-level reduced-motion settings always take priority, and rewards remain visible with movement and confetti disabled.
