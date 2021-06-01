<p align="center">
<img src="https://raw.githubusercontent.com/sixem/eyy-indexer/master/logo.svg">
</p>

<p align="center">
<a href="https://github.com/sixem/eyy-indexer/releases"><img alt="GitHub releases" src="https://img.shields.io/github/v/release/sixem/eyy-indexer?color=37bd44&style=for-the-badge"></a> <img alt="GitHub issues" src="https://img.shields.io/github/issues/sixem/eyy-indexer?style=for-the-badge"> <img src="https://img.shields.io/github/license/sixem/eyy-indexer?style=for-the-badge"> <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sixem/eyy-indexer?style=for-the-badge">
</p>

<br/>

## What is this project?

This is a simple file directory viewer script written in PHP and JavaScript.

This Indexer is designed to be a more image and video friendly Indexer while still having most of the basic functions of any other Indexer or Directory Lister. It is also designed to have a retro and simple feel to it which is why it doesn't use any fancy CSS or icon packs.

JavaScript is not required for the Indexer but it is needed for the extra functionality.

### Demo

***You can visit the [demo](https://five.sh/demo/indexer/) to view the indexer in action.***

### Feedback :bulb:
I'm open for any feedback.

You can open an [issue](https://github.com/sixem/eyy-indexer/issues) if you encounter any **specific** problems or bugs of any kind.

Or, you can start a [discussion](https://github.com/sixem/eyy-indexer/discussions) if you just have any general questions or minor issues you want to troubleshoot. You can also suggest any features or potential changes there.

# Features
### **Authentication**
The script supports HTTP authentication, allowing you to add a bit of protection to your directories.
### **Gallery Mode**
A gallery mode where you can view images and videos of the current directory without needing to visit each URL separately. It has support for downloading files and reverse searching images.
### **Hover Previews**
Displays a preview of the image or video when hovering over the name.
### **Search Filter**
The search filter can be used to search for filenames or filetypes in the current directory. Usage (Desktop): `Shift + F`.
### **Single file**
This script can be set up as a single file script (standalone setup). Only one file needed, nothing more.
### **Customizable**
This script can be customized in a number of ways. (See: [Configuration](docs/CONFIG.md))
### **And much more ..**
+ All dates will match the timezone of the client.
+ Persistent client-set sorting settings.
+ Support for custom themes.
+ Server-side filtering which can help you hide specific files or folders.
+ Paths can be clicked, allowing for easy navigation between folders.
+ The client can set their own settings in the menu.
+ Direct download links.
+ Mobile friendly.

# Setup
## 1. Files

You can choose between having a **default** setup and a **standalone** setup.

The default setup will import assets (`js`, `css` etc.) as separate files, like most sites. This is the most orderly setup.

The standalone setup will have all of these files bundled directly into the `.php` file. This may slightly increase the time it takes for the page to load but it usually won't be noticeable at all.

### Default
Place the files from the [/public/](public/) directory into your root web directory.
### Standalone (Single file)
Place the file from the [/standalone/](standalone/) directory into your root web directory.

## 2. Server Configuration

The Indexer does require you to use it as an `index` file, that way it can be automatically applied to directories that do not have a defualt `index` file present, this makes it behave just like any other default and built-in directory indexes. This can all be done easily by following the steps below, **depending** on what web server you are using.

### Nginx
To use this script for all directories without a default index you need append `/indexer.php` to the end of your `index` line in your server configuration. This will tell Nginx to use the Indexer if none of the default indexes exist.

Example usage:
```
server {
        index index.html index.htm index.php /indexer.php;
}

```
Alternatively, you can only make it work for certain directories:
```
server {
        location ~ ^/(videos|images)/ {
                index /indexer.php;
        }
}

```
### Apache
In order to automatically use this script as a default index, you need to edit your Apache configuration. To do this, you must place `/indexer.php` at the end of your `DirectoryIndex` directive.

Example usage:
```
DirectoryIndex index.php index.html index.htm /indexer.php
```

This line can be placed in either your server's `.conf` file or your `.htaccess` file. This will tell Apache to use the Indexer if none of the default indexes exist.

# Configuration
The Indexer can be customized by editing the config available inside of the [indexer.php](public/indexer.php).

You can read the [CONFIG.md](docs/CONFIG.md) to see a more detailed overview of the available options.

# Building
You can build this script from source using `npm`.


**Clone repository and install dependencies**
```
git clone https://github.com/sixem/eyy-indexer
cd eyy-indexer
npm install
```

**Build (production)**

*Generates minified files*
```
npm run build
```

**Build (development)**

*Generates a source mapped output*
```
npm run build-dev
```

# Contributing
You can contribute by submitting a pull request to the current [dev](https://github.com/sixem/eyy-indexer/branches) branch.

## Disclaimer
***As you with anything else, use this script at your own risk. There may exist bugs that i do not know of.***