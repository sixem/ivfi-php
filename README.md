<br/>
<div align="center">
	<img height="100" src="./docs/logo.svg">
	<br/><br/>
	<h3 align="center">IVFi-PHP</h3>
	<p align="center"><i>The image and video friendly indexer</i></p>
</div>

<p align="center"><a href="https://github.com/sixem/ivfi-php/releases"><img alt="GitHub releases" src="https://img.shields.io/github/v/release/sixem/ivfi-php?color=2f394f"></a> <img alt="GitHub issues" src="https://img.shields.io/github/issues/sixem/ivfi-php?color=2f394f"> <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sixem/ivfi-php?color=30c352"> <a href="https://github.com/sixem/ivfi-php/actions/workflows/main.yml"><img alt="Build" src="https://github.com/sixem/ivfi-php/actions/workflows/main.yml/badge.svg"></a></p>

<p align="center">
	<a href="https://five.sh/demo/indexer/">Demo</a>&nbsp;&nbsp;
	<a href="https://github.com/sixem/ivfi-php/blob/main/docs/README.md">Documentation</a>&nbsp;&nbsp;
	<a href="https://github.com/sixem/ivfi-php/blob/main/docs/config.md">Configuration</a>&nbsp;&nbsp;
	<a href="https://github.com/sixem/ivfi-php/blob/main/docs/building.md">Building</a>
</p>

## Introduction

IVFi-PHP is a directory browser with an image, video, and audio gallery, hover previews, search, and ZIP downloads. It runs on a PHP web server or through Docker.

Basic listings work without JavaScript; interactive features require it.

## Quick setup

1. Download the [latest release](https://github.com/sixem/ivfi-php/releases).
2. Copy the contents of `build/` into your web root, such as `/var/www/html/`.
3. Add `indexer.php` as a fallback index file in your web-server configuration.

**Nginx** - inside your `server` block:

```nginx
index index.html index.php /indexer.php;
```

**Apache:**

```apache
DirectoryIndex index.html index.php /indexer.php
```

See [setup](docs/setup.md) for standalone and Docker options, [configuration](docs/config.md) for settings, or [building](docs/building.md) to build from source.

## Development

With Node 20+, pnpm and PHP 8+ installed:

```sh
pnpm install
pnpm dev --files /path/to/files
```

See [development options](docs/building.md#development).

## Features

- **Gallery:** browse images, videos, and audio, download files, and reverse-search images.
- **Hover previews:** preview media by hovering over its filename.
- **Audio:** playback with a live visualiser, seeking, and separate volume control.
- **Search:** filter filenames with regex or wildcards (`Ctrl/Cmd + F`).
- **Downloads:** download individual files or a selection as a ZIP archive.
- **Standalone:** use a single PHP file with embedded assets.
- **Customization:** themes, saved display preferences, and server-side filters.
- **Authentication:** optional Digest protection for listings. See [authentication](docs/config.md#authentication).
- **Extra features:** optional [README support](docs/extras.md).

## Feedback

Report bugs in [issues](https://github.com/sixem/ivfi-php/issues), or use [discussions](https://github.com/sixem/ivfi-php/discussions) for questions and ideas. Pull requests are welcome; see [contributing](https://github.com/sixem/ivfi-php/blob/main/CONTRIBUTING.md).

## License

Licensed under [GPL-3.0](LICENSE). Included libraries retain their own licenses.
