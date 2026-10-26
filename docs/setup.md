<h1 align="center">Setup</h1>
<p align="center">How to set up and use the Indexer</p>

## Download

Download the [latest release](https://github.com/sixem/ivfi-php/releases), or [build from source](building.md).

## PHP support

Regular and standalone builds are tested on PHP 8.2, 8.3, 8.4 and 8.5. Older versions are not covered by the current runtime checks.

## Files

Choose one setup from the release archive:

- **Default:** copy the contents of `build/` into your web root. Assets are separate files.
- **Standalone:** copy `standalone/indexer.php` into your web root. Assets are embedded in this single file.

## Server Configuration

Your web server must be configured to run PHP. Add IVFi as a fallback index for directories without their own index page.

### Nginx
Append `/indexer.php` to the `index` directive:
```conf
server {
        index index.html index.php /indexer.php;
}

```
To limit it to specific directories:
```conf
server {
        location ~ ^/(videos|images)/ {
                index /indexer.php;
        }
}

```
### Apache
Append `/indexer.php` to `DirectoryIndex` in your server config or `.htaccess`:

```conf
DirectoryIndex index.html index.php /indexer.php
```

## Docker

Docker builds the app and runs Nginx with PHP 8.4-FPM. No local Node or PHP installation is needed.

```bash
git clone https://github.com/sixem/ivfi-php
cd ivfi-php/docker
cp .env.example .env
```

Set `SERVEPOINT` in `.env` to an existing directory containing your files. `PORT` defaults to `8080`; `BIND_ADDRESS` defaults to `127.0.0.1`.

Use `0.0.0.0` to accept connections from other machines.

Edit `config.php` for Indexer settings, then start:

```bash
docker compose up --build -d
```

Open `http://localhost:8080/`. Use `docker compose logs` to inspect logs and `docker compose down` to stop.

After changing `config.php`, restart PHP with `docker compose restart php`.

Media and config mounts are read-only. Both services run without root privileges, so mounted files must be readable by their container users. Hidden files and PHP files are not served; Nginx does not serve symlinked media files. Keep private files outside the media directory. Indexer authentication protects listings, not direct file downloads.

For updates, rebuild with `docker compose build --pull` and run `docker compose up -d`.

Upgrading an older Docker setup? Use the new `.env.example`; `PORT` now takes only the host port. `docker-populate` is no longer needed.
