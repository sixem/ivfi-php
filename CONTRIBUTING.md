# Contributing

Bug reports, feature suggestions and pull requests are welcome. See [building](docs/building.md) for source setup.

Run `pnpm dev --files /path/to/files` for local development with live reload.

## Checks

Run the checks relevant to your change from the repository root:

| Command | Checks | Requirements |
|---|---|---|
| `pnpm test` | Lint, production build and standalone output | Node 20+ and pnpm |
| `pnpm test:dev` | Dev server, watcher and live reload | Node 20+, pnpm and PHP 8+ |
| `pnpm test:gallery` | Media, notifications and responsive gallery behavior | Built output, PHP 8+ and Chromium (see below) |
| `composer install` then `composer test` | PHP regression tests | PHP 8.3+, Composer and built PHP outputs |
| `bash scripts/test-php-versions.sh` | Both outputs on PHP 8.2–8.5 | Docker and the PHP test dependencies above |
| `bash scripts/test-readme.sh` | Optional README rendering in both outputs | Node, PHP with mbstring, and installed build/test dependencies |
| `bash scripts/test-docker.sh` | Docker build and deployment | Docker and curl |
| `bash scripts/test-release.sh` | Release packaging | Built PHP outputs, 7z and jq |

Limit the compatibility run by passing versions, for example `bash scripts/test-php-versions.sh 8.4 8.5`.

For browser tests, install Chromium with `pnpm exec playwright-core install chromium` or set `CHROMIUM_PATH`, then run `pnpm build && pnpm test:gallery`.

PHP defaults live in `src/php/config.php` and are embedded at build time. Edit sources rather than generated files in `build/`.

`pnpm run pack-release` writes release ZIPs to `releases/`.
