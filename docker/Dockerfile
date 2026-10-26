# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /src
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY webpack.config.js build.helpers.js build.options.json tsconfig.json ./
COPY src/ ./src/
COPY extras/ ./extras/
COPY scripts/make-standalone.js ./scripts/make-standalone.js
RUN pnpm run make-standalone

FROM php:8.4-fpm-alpine AS php
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && sed -i '/^user = /d; /^group = /d' /usr/local/etc/php-fpm.d/www.conf
COPY --from=build /src/build/ /opt/ivfi/public/
COPY docker/php/pool.conf /usr/local/etc/php-fpm.d/zz-ivfi.conf
WORKDIR /opt/ivfi/public
USER www-data
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD php -r 'exit(@fsockopen("127.0.0.1", 9000) ? 0 : 1);'

FROM nginx:stable-alpine AS web
COPY --from=build /src/build/ /opt/ivfi/public/
COPY docker/nginx/main.conf /etc/nginx/nginx.conf
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD wget -q -O - http://127.0.0.1:8080/.ivfi-health | grep -qx pong
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
