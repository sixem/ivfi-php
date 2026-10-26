<h1 align="center">
  <img src="./logo.svg">
</h1>

<h3 align="center">
  <span>The image and video friendly Indexer</span><br>
</h3>

<p align="center">
<a href="https://github.com/sixem/ivfi-php/releases"><img alt="GitHub releases" src="https://img.shields.io/github/v/release/sixem/ivfi-php?color=2f394f&style=flat"></a> <img alt="GitHub issues" src="https://img.shields.io/github/issues/sixem/ivfi-php?color=5a8f4e&style=flat"> <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sixem/ivfi-php?color=4b8b72&style=flat"> 
<a href="https://github.com/sixem/ivfi-php/actions/workflows/main.yml"><img alt="Build status" src="https://github.com/sixem/ivfi-php/actions/workflows/main.yml/badge.svg"></a>
</p>

---

## Introduction

IVFi-PHP is a directory browser with an image and video gallery, hover previews, search, and ZIP downloads. It runs on a PHP web server or through Docker.

Start with [setup](setup.md), then [configure](config.md) it to your liking. Try the [demo](https://five.sh/demo/indexer/) to see it in action.

Basic listings work without JavaScript; interactive features require it.

## Features

- **Gallery:** browse images and videos, download files, and reverse-search images.
- **Hover previews:** preview media by hovering over its filename.
- **Search:** filter the current directory by name or type (`Shift + F` on desktop).
- **Downloads:** download individual files or a selection as a ZIP archive.
- **Standalone:** use a single PHP file with embedded assets.
- **Customization:** themes, saved display preferences, and server-side filters.
- **Authentication:** optional Digest protection for listings. Direct files need web-server access controls; see [authentication](config.md#authentication).
- **Extra features:** optional [README support](extras.md), disabled by default.

## Feedback <!-- {docsify-ignore} -->

Report bugs in [issues](https://github.com/sixem/ivfi-php/issues), or use [discussions](https://github.com/sixem/ivfi-php/discussions) for questions and ideas. Pull requests are welcome; see [contributing](https://github.com/sixem/ivfi-php/blob/master/CONTRIBUTING.md).

## License

Licensed under [GPL-3.0](https://github.com/sixem/ivfi-php/blob/master/LICENSE). Included libraries retain their own licenses.
