# Single-container image: the indexer built from source, served by nginx and
# php-fpm. The browsable directory is /data; mount a persistent volume there.
#
# See docker/image/README.md for the environment variables it reads.

FROM node:26-alpine AS build

WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM php:8.5-fpm-alpine

RUN apk add --no-cache nginx \
	&& mkdir -p /data /var/lib/ivfi/sessions /run/nginx \
	&& chown -R www-data:www-data /var/lib/ivfi

COPY docker/image/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/image/fpm.conf /usr/local/etc/php-fpm.d/zz-ivfi.conf
COPY docker/image/generate-config.php /usr/local/lib/ivfi/generate-config.php
COPY --chmod=755 docker/image/entrypoint.sh /usr/local/bin/ivfi-entrypoint

COPY --from=build /src/build/ /var/www/html/

ENV IVFI_MAX_UPLOAD_SIZE=100M \
	IVFI_CLIENT_IP_HEADER=CF-Connecting-IP

VOLUME ["/data"]
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget -q -O /dev/null http://127.0.0.1/fpm-ping || exit 1

ENTRYPOINT ["ivfi-entrypoint"]
