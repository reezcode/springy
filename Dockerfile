# Build both languages from the locked source dependencies.
# Node 22.23.4+ fixes the October 2026 security releases (CVE-2026-111497 et al.).
FROM node:22.23.4-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Serve only exported assets: no Node server, source files, or dependencies.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY --from=build /app/out/ /usr/share/nginx/html/
COPY --from=build /app/.generated/security-csp.conf /etc/nginx/csp.conf
COPY nginx.conf /etc/nginx/nginx.conf
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
