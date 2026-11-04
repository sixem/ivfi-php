<h1 align="center">Building</h1>

<p align="center">Instructions on how to build from source.</p>

<br/>

Use Node 20 or newer and `pnpm`. Node 24 is recommended (`.nvmrc`).

**Clone repository and install dependencies:**
```bash
git clone https://github.com/sixem/ivfi-php
cd ivfi-php
pnpm install
```

If `pnpm` is not already installed, Corepack can provide the version declared in `package.json` by running `corepack enable pnpm` before installing dependencies.

## Production builds

Build from source, creating minified files:

```bash
pnpm run build
```

Build a standalone file from source:

```bash
pnpm run make-standalone
```

Output goes in `build`. See [setup](setup.md) for deployment.

## Development

After installing dependencies, use PHP 8+ and run:

```bash
pnpm dev --files /path/to/files
```

Open `http://localhost:13131/`. PHP and the watcher run together; Ctrl+C stops both.

- CSS updates in place; JavaScript and PHP changes reload the page.
- Failed builds keep the last working version.
- Debugging is enabled; use DevTools **Verbose** for detailed logs.

The server is local-only. Development output goes in `.ivfi-dev/`, separate from production `build/`.

### Options

| Option | Description | Default |
|---|---|---|
| `--files <directory>` | Directory to browse; required unless saved locally | — |
| `--port <number>` | Browser-facing HTTP port | `13131` |
| `--php <executable>` | PHP executable name or path | `php` on `PATH` |
| `--poll` | Poll every second; useful for WSL or network drives | Off |
| `--no-poll` | Disable polling | — |
| `--help` | Print usage | — |

Relative paths start at the repository root. Quote paths containing spaces:

```powershell
pnpm dev --files "C:/Users/you/My files" --php "C:/tools/php/php.exe"
```

### Local defaults

Save defaults in the gitignored `dev.config.local.json`:

```json
{
    "files": "/path/to/files",
    "port": 13131,
    "poll": false
}
```

Run `pnpm dev`; CLI flags override saved `files`, `port`, `poll`, and `php` values. Restart for config/build-script changes; refresh for media changes.

Run one dev process per checkout. Check the terminal for errors; use `--poll` for missed changes, `--port` for port conflicts, or `--php` for a custom PHP path.

### Manual commands

Build source-mapped files in `build/`:

```bash
pnpm run build-dev
# Or keep rebuilding:
pnpm run build-dev-watch
```

After building, serve without live reload:

```bash
php -S 127.0.0.1:13131 -t /path/to/files scripts/dev-router.php
```

## Build Options

You can edit `build.options.json` to enable extra features or change output options:

```json
{
    "extraFeatures": {
        "readmeSupport": false
    },
    "extrasDir": "extras",
    "assetDir": "indexer"
}
```
* `extraFeatures` will enable or disable features when building. For more information see [extras](extras.md).

* `extrasDir` sets the directory where `extras` are located.

* `assetDir` sets the directory where resources (`.js`, `.css` and fonts) will be placed in. This also affects any references in the HTML/CSS.
