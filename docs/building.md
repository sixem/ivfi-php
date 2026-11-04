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

Open `http://localhost:13131/`. This single command starts PHP, watches the source, and updates every connected browser tab after successful builds:

- CSS updates without refreshing, preserving gallery and playback state.
- JavaScript and PHP updates refresh the page.
- Generated PHP is syntax-checked before a development build is published.
- Failed builds print errors in the terminal and leave the current page running. Fixing the error triggers another build.
- Browser console diagnostics and PHP debugging are enabled automatically. The console shows concise IVFi messages; enable **Verbose** (or **Debug**) in DevTools for configuration, preview, resize and optimizer traces. Warnings and errors remain visible even with debugging disabled. Production builds keep the configured `debug` setting.
- The terminal shows the local URL, media directory and timed build results. Colors are automatic for terminals; set `NO_COLOR=1` to disable them. Redirected logs stay plain text.
- Ctrl+C stops both PHP and the watcher.

Files are streamed with byte-range support, so audio and video seeking works. The server binds to the local machine only. No systemd, Docker, browser extension or extra global Node package is required.

Development output goes to the ignored `.ivfi-dev/` directory. Production builds still use `build/`, so they can run alongside development. The reload client is injected by the dev server; it is never added to build artifacts.

### Options

| Option | Description | Default |
|---|---|---|
| `--files <directory>` | Directory to browse; required unless saved locally | — |
| `--port <number>` | Browser-facing HTTP port | `13131` |
| `--php <executable>` | PHP executable name or path | `php` on `PATH` |
| `--poll` | Check source files every second when native watch events are unreliable | Off |
| `--no-poll` | Disable polling set in local configuration | — |
| `--help` | Print usage | — |

Quote paths containing spaces. Relative paths are resolved from the repository root. For example, on Windows:

```powershell
pnpm dev --files "C:/Users/you/My files" --php "C:/tools/php/php.exe"
```

### Local defaults

Create `dev.config.local.json` in the repository root to avoid repeating personal options. Git ignores this file:

```json
{
    "files": "/path/to/files",
    "port": 13131,
    "poll": false
}
```

Then run `pnpm dev`. The supported keys are `files`, `port`, `poll`, and `php`; command-line options override them. Restart the command after changing local configuration, build options, build scripts or optional extras. Files in the browsed directory are not watched; refresh the page to update their listing.

### Troubleshooting

- **Changes are not detected:** add `--poll`, particularly with WSL mounted drives or network filesystems. Native watching is the default to keep idle work low.
- **Port already in use:** stop the other server or pass a different `--port`. PHP's internal port is selected automatically.
- **PHP cannot be found:** install PHP CLI and add it to `PATH`, or supply `--php`.
- **Build error:** read the terminal output. The browser updates only once the build succeeds.

The launcher also works directly as `node scripts/dev.js --files /path/to/files`, which is useful for service managers. Run one launcher per checkout; it owns the watcher and PHP process, so do not start a second watcher for `.ivfi-dev/`.

### Build-only and manual server commands

To build source-mapped files in `build/` without starting a server:

```bash
pnpm run build-dev
# Or keep rebuilding:
pnpm run build-dev-watch
```

For a PHP server without browser reloads, build first and run:

```bash
php -S 127.0.0.1:13131 -t /path/to/files scripts/dev-router.php
```

The router serves files from the document root and assets from `build/`, including byte-range support for audio and video.

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
