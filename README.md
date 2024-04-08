<br/>
<div align="center">
	<img height="100" src="./logo.svg">
	<br/><br/>
	<h3 align="center">IVFi-PHP</h3>
	<p align="center"><i>The image and video friendly indexer</i></p>
</div>

<br/>

<p align="center">
<a href="https://github.com/sixem/ivfi-php/releases"><img alt="GitHub releases" src="https://img.shields.io/github/v/release/sixem/ivfi-php?color=2f394f&style=flat-square"></a> <img alt="GitHub issues" src="https://img.shields.io/github/issues/sixem/ivfi-php?color=5a8f4e&style=flat-square"> <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sixem/ivfi-php?color=4b8b72&style=flat-square"> 
<img alt="Travis (.com)" src="https://img.shields.io/travis/com/sixem/ivfi-php?style=flat-square">
</p>

<br/>

<p align="center">
	<a href="https://git.five.sh/ivfi/demo/">Demo</a>&nbsp;&nbsp;
	<a href="https://git.five.sh/ivfi/docs/php/#/README">Documentation</a>&nbsp;&nbsp;
	<a href="https://git.five.sh/ivfi/docs/php/#/config">Configuration</a>&nbsp;&nbsp;
	<a href="https://git.five.sh/ivfi/docs/php/#/building">Building</a>
</p>

<br/>

# About

IVFi-PHP is a file directory browser script made in PHP and TypeScript.

It is designed to be a comprehensive indexer, with a focus on efficiently handling image and video files. IVFi has a modern and user-friendly interface, offering features such as a gallery view, hoverable previews, and many customization options.

This project can be easily set up on most web servers.

<br/>

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

<br/>

For detailed instructions on how to configure the script, refer to [setup](https://git.five.sh/ivfi/docs/php/#/setup).

The releases and individual builds are available [here](https://git.five.sh/ivfi/releases/php/).

<br/>

# Features

### **Authentication**
> It includes support for HTTP authentication, providing some added security for your directories.
### **Gallery Mode**
> A gallery mode that allows you to view images and videos from the current directory in one place, as well as the ability to download files and perform reverse image searches.
### **Hover Previews**
> An image or video preview is displayed when hovering over the file name.
### **Search Filter**
> The filter function allows you to search for specific filenames or file types within the directory.<br/><br/>Usage (Desktop): `Shift + F`.
### **Single file**
> The script can be configured as a standalone solution, where all required assets are combined into a single file, making it easy to use with just one file needed.
### **Customizable**
> This script offers multiple customization options.
### **Additonal Features**
> It can be built with added functionality, such as the ability to display `README.md` files in each directory!

<br/>

### **And much more ...**
+ :clock12: The dates will be adjusted to match the time zone of the client.
+ :arrow_up_down: Client-defined sorting preferences are stored persistently.
+ :art: Support for custom themes.
+ :mag: Server-side filtering which can help you hide specific files or folders.
+ :link: Navigating between folders is made easy with the clickable paths.
+ :gear: The client has the option to personalize their settings through the menu.
+ :inbox_tray: Direct download links for all files.
+ :desktop_computer: Compatible with both mobile and desktop devices.

<br/>

# Feedback

If you have come across any specific problems or bugs that you would like to report, you have the option to open an [issue](https://github.com/sixem/ivfi-php/issues). This will allow us to better understand the issue at hand and take the necessary steps to resolve it.

Alternatively, if you have any general questions, minor issues, or ideas for improvements that you would like to discuss, you can start a [discussion](https://github.com/sixem/ivfi-php/discussions). This is a good way for you to share your thoughts and ideas with us, and we would be more than happy to listen and consider them.

<br/>

## License
This project is licensed under GPL-3.0. It also includes external libraries that are available under a variety of licenses.

See [LICENSE](LICENSE) for the full license text.

## Disclaimer
As with anything else, use this script at your own risk. There could exist bugs that I do not know of :v: