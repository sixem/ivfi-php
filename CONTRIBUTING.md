# Contributing

Bug reports, feature suggestions and pull requests are welcome. See [building](docs/building.md) for source setup.

## Checks

Run the checks relevant to your change from the repository root:

| Command | Checks | Requirements |
|---|---|---|
| `pnpm test` | Lint, production build and standalone output | Node 20+ and pnpm |
| `composer install` then `composer test` | PHP regression tests | PHP 8.3+, Composer and built PHP outputs |
| `bash scripts/test-php-versions.sh` | Both outputs on PHP 8.2–8.5 | Docker and the PHP test dependencies above |
| `bash scripts/test-docker.sh` | Docker build and deployment | Docker and curl |
| `bash scripts/test-release.sh` | Release packaging | Built PHP outputs, 7z and jq |

Limit the compatibility run by passing versions, for example `bash scripts/test-php-versions.sh 8.4 8.5`.

PHP defaults live in `src/php/config.php` and are embedded at build time. Edit sources rather than generated files in `build/`.

`pnpm run pack-release` writes release ZIPs to `releases/`.
