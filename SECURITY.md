# Springy security

This is a static learning site. The production container serves HTML, CSS, JavaScript, and SVG assets; it does not run a Next.js application server, compile submitted Java, execute container commands, upload files, or forward playground requests to external services. Exercises are learning checks, not a trusted certification or authorization boundary.

## Controls implemented

- **Dependency maintenance:** Next.js was updated from 16.3.4 to 16.3.8 after the npm advisory audit identified affected versions. Install exact locked dependencies with `npm ci` and repeat `npm audit` when rebuilding. A clean audit is a point-in-time dependency check, not proof that a site is vulnerability-free.
- **XSS defenses:** React renders notes, code, and exercise input as text. The markdown parser does not accept raw HTML and only creates external links for HTTP(S) URLs. External links use `noopener noreferrer`. Learner input never reaches `eval`, `Function`, a shell, or an HTML injection sink. The one intentional inline theme script contains application-owned code only.
- **CSP:** the post-build step hashes the exact inline scripts in each exported page. Nginx uses those per-page hashes and self-hosted scripts; it does not allow `unsafe-inline` or `unsafe-eval` for scripts. Inline event handlers, framing, objects, base URL changes, and form submissions are blocked. Inline styles remain allowed because React progress widgets and framework rendering use style attributes. This exception does not permit inline JavaScript.
- **Response headers:** Nginx sets CSP, `nosniff`, `DENY` framing, a restricted referrer policy, a permissions policy disabling unused capabilities, and same-origin opener/resource policies, including on error responses. It hides its version, disables directory listings, rejects dotfile requests, and only accepts GET and HEAD.
- **Input limits:** progress imports are validated in the store as well as the file picker. Unknown/prototype-style keys are discarded, numeric counters are bounded, notes are capped at 20,000 characters, and code checking rejects input above 50,000 characters before regex evaluation. Import parsing failures return a visible error rather than executing or trusting file content.
- **Container isolation:** the runtime contains only static assets and Nginx. It runs as UID/GID 101 on port 8080, without Linux capabilities or privilege escalation. Compose makes the root filesystem read-only, restricts writable space to bounded tmpfs, applies resource and process limits, rotates logs, and binds only to host loopback by default. It mounts no host directories, credentials, or Docker socket.

These choices follow applicable guidance in the [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html), [HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), and [Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html). This is not an OWASP certification or an independent penetration test.

## Public deployment responsibilities

Terminate TLS at your trusted reverse proxy, redirect HTTP to HTTPS, and set HSTS on HTTPS responses after validating the domain and certificate setup. Start with `Strict-Transport-Security: max-age=31536000`; add includeSubDomains only when every subdomain supports HTTPS. Do not trust arbitrary client-supplied forwarding headers. Keep the app port private and permit only the proxy to reach it.

The provided Compose file is suitable for local use or a proxy on the same host. If the proxy is another container, attach both to a private Docker network and target `web:8080`; avoid opening the app port to the public network. Configure limits, HTTPS, and any additional rate controls at the edge for the actual hosting environment.

Base images use maintained Node 22 and Nginx stable tags so `docker compose build --pull` picks up patches. Production release processes should resolve and pin reviewed image digests, scan the resulting runtime image, and regularly rebuild with updated patches. No container image vulnerability scan is implied by an npm dependency audit.

If publishing `out/` through a different server or CDN, apply equivalent headers there. Uploading static assets alone does not install `nginx.conf` or its CSP map. Any change to inline script bytes requires regenerating the hashes. Keep generated CSP configuration matched to the exact deployed export.

## Verification

```sh
npm run check
npm audit
npm run test:browser
docker compose config
docker compose up --build -d
docker compose ps
curl -I http://127.0.0.1:8080/
curl -I http://127.0.0.1:8080/en/
curl -I http://127.0.0.1:8080/nonexistent
curl -X POST -i http://127.0.0.1:8080/
```

Browser tests serve the production export with the policies read from `nginx.conf` and verify that the app hydrates, injected inline scripts are blocked, imported HTML notes remain inert, and switching language preserves notes and results. This supplements rather than replaces running the actual Nginx container and checking its headers and health in your deployment.

Progress and notes are stored locally in the browser and shared across the two languages on the same origin. They are not encrypted or authenticated and should not contain secrets. Host security, DNS, TLS, browser extensions, localStorage availability, and reverse-proxy configuration remain outside the application’s control.
