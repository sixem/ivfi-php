<br/>
<div align="center">
	<img height="100" src="./logo.svg">
	<br/><br/>
	<h3 align="center">IVFi-PHP</h3>
	<p align="center"><i>The image and video friendly indexer</i></p>
</div>

<p align="center"><a href="https://github.com/sixem/ivfi-php/releases"><img alt="GitHub releases" src="https://img.shields.io/github/v/release/sixem/ivfi-php?color=2f394f"></a> <img alt="GitHub issues" src="https://img.shields.io/github/issues/sixem/ivfi-php?color=2f394f"> <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sixem/ivfi-php?color=30c352"> <a href="https://github.com/sixem/ivfi-php/actions/workflows/main.yml"><img alt="Build" src="https://github.com/sixem/ivfi-php/actions/workflows/main.yml/badge.svg"></a></p>

<p align="center">
	<a href="https://github.com/sixem/ivfi-php/">Repository</a>&nbsp;&nbsp;
	<a href="https://github.com/sixem/ivfi-php/blob/master/docs/README.md">Documentation</a>&nbsp;&nbsp;
	<a href="https://github.com/sixem/ivfi-php/blob/master/docs/config.md">Configuration</a>&nbsp;&nbsp;
	<a href="https://github.com/sixem/ivfi-php/blob/master/docs/building.md">Building</a>
</p>

# About

IVFi-PHP is a directory browser written in PHP and TypeScript, with an image and video gallery, hover previews, search, and ZIP downloads.

# Quick setup :zap:

* Download the latest release [here](https://github.com/sixem/ivfi-php/releases).
* Place the `/build/` files into your web root. For example `/var/www/html/`.
* Then, use the `indexer.php` as an index file for any of the directories where the script should be used:

#### Nginx - Example using the [index](https://nginx.org/en/docs/http/ngx_http_index_module.html#index) directive:
```
server {
        index index.html index.php /indexer.php;
}
```

#### Apache - Example using the [DirectoryIndex](https://httpd.apache.org/docs/2.4/mod/mod_dir.html#directoryindex) directive:
```
DirectoryIndex index.html index.php /indexer.php
```

See [setup](docs/setup.md) for standalone and Docker options, and [configuration](docs/config.md) for settings.

# Features

### **Authentication**
> Optional HTTP Digest authentication for listings. Direct downloads need web-server access controls; see [authentication](docs/config.md#authentication).
### **Gallery Mode**
> Browse images and videos without leaving the listing, download files, or reverse-search images.
### **Hover Previews**
> An image or video preview is displayed when hovering over the file name.
### **Search Filter**
> Search filenames or file types in the current directory. Open with `Shift + F` on desktop.
### **Downloads**
> Download individual files or bundle a selection into a ZIP archive, with progress shown while the archive is created.
### **Single file**
> A standalone build bundles the app and its assets into one PHP file.
### **Customizable**
> This script offers multiple customization options.
### **Additional Features**
> Optional [README support](docs/extras.md), disabled by default.

### **And much more ...**
+ :clock12: The dates will be adjusted to match the time zone of the client.
+ :arrow_up_down: Client-defined sorting preferences are stored persistently.
+ :art: Support for custom themes.
+ :mag: Server-side filtering which can help you hide specific files or folders.
+ :link: Navigating between folders is made easy with the clickable paths.
+ :gear: The client has the option to personalize their settings through the menu.
+ :inbox_tray: Direct download links for all files.
+ :desktop_computer: Compatible with both mobile and desktop devices.

# Feedback

Report bugs in [issues](https://github.com/sixem/ivfi-php/issues), or use [discussions](https://github.com/sixem/ivfi-php/discussions) for questions and ideas. For code changes and test commands, see [contributing](https://github.com/sixem/ivfi-php/blob/master/CONTRIBUTING.md).

## License
This project is licensed under GPL-3.0. It also includes external libraries that are available under a variety of licenses.

See [LICENSE](LICENSE) for the full license text.

## Disclaimer
As with anything else, use this script at your own risk. There could exist bugs that I do not know of :v:
