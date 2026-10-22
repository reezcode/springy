# Folder out/ hasil Next.js static export sudah disertakan dalam paket.
# Bila source berubah, jalankan pnpm build sebelum docker/podman build.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY out/ /usr/share/nginx/html/
EXPOSE 80
