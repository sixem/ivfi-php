<h1 align="center">
  <img src="https://raw.githubusercontent.com/sixem/eyy-indexer/master/logo.svg">
</h1>

<h3 align="center">
  <span>An image and video friendly Indexer</span><br>
</h3>

<p align="center">
<a href="https://github.com/sixem/eyy-indexer/releases"><img alt="GitHub releases" src="https://img.shields.io/github/v/release/sixem/eyy-indexer?color=2f394f&style=flat"></a> <img alt="GitHub issues" src="https://img.shields.io/github/issues/sixem/eyy-indexer?color=5a8f4e&style=flat"> <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sixem/eyy-indexer?color=4b8b72&style=flat"> 
<img alt="Travis (.com)" src="https://img.shields.io/travis/com/sixem/eyy-indexer?style=flat">
</p>

---

## What is this project?

This is a file directory browser script written in PHP and JavaScript.

This is designed to be a image and video friendly Indexer, while also being an Indexer that has all of the other features that you can expect from most directory listers out there. It can be heavily customized, and has a design that attempts to be appealing while also being functional and easy to use.

***Note: The Indexer can be used without JavaScript, but it is needed for the extra functionality.***

## Demo
***You can visit the [demo](https://five.sh/demo/indexer/) to view the indexer in action.***

## Documentation
:link: <https://sixem.github.io/eyy-indexer/>

## Feedback :bulb:
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
The search filter can be used to search for filenames or filetypes in the current directory.

Usage (Desktop): `Shift + F`.
### **Single file**
This script can be set up as a single file script (standalone setup). Only one file needed, nothing more.
### **Customizable**
This script can be customized in a number of ways.
### **Additonal Features**
It can be built with additional features, like support for displaying `README.md` files on each directory!
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

### Download the latest release [HERE](https://github.com/sixem/eyy-indexer/releases)!

Alternatively, you can also build it from source yourself, for that see: [Building](#building).

You can also find every release and specific builds here: [https://five.sh/releases/eyy-indexer/](https://five.sh/releases/eyy-indexer/)
<br />
<br />
#### These instructions are aimed at servers using a regular Nginx or Apache setup.
#### For instructions on how to use it with Docker, see [this](https://sixem.github.io/eyy-indexer/#/setup?id=docker).

## 1. Files

You can choose between having a **default** setup and a **standalone** setup.

The default setup will import assets (`js`, `css` and fonts) as separate files, like most sites. This is the normal setup.

The standalone setup will have all of these files bundled directly into the `.php` file instead, serving everything through HTML.

### Default:
Place the files from the `build` directory into your root web directory.
### Standalone (single file):
Place the file from the `standalone` directory into your root web directory.

## 2. Server Configuration

The Indexer does require you to use it as an `index` file, that way it can be automatically applied to directories that do not have a defualt `index` file present. This makes it behave just like any other default and built-in directory indexes. This can all be done easily by following the steps below, **depending** on what web server you are using.

### Nginx
To use this script for all directories without a default index you need append `/indexer.php` to the end of your `index` line in your server configuration. This will tell Nginx to use the Indexer if none of the default indexes exist.

Example usage:
```
server {
        index index.html index.php /indexer.php;
}

```
Another example, here it is only being applied to a few directories:
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
DirectoryIndex index.html index.php /indexer.php
```

This line can be placed in either your server's `.conf` file or your `.htaccess` file. This will tell Apache to use the Indexer if none of the default indexes exist. This can be set globally or on a per-directory basis depending on your usecase.

# Configuration

#### See [Configuration](https://sixem.github.io/eyy-indexer/) for a detailed overview over how this script can be customized.

## Additional features

When building the Indexer, additional features can be enabled. These features are not bundled with the pre-built releases, and must be flagged as enabled prior to building the Indexer yourself (see below for how the building process is done).

The reason why these features are not included in the default version, is because they may rely on larger libraries and other scripts, which I don't feel should be pushed into the vanilla version unless the user desires to do so themselves!

See [Extra Features](https://sixem.github.io/eyy-indexer/#/extras) for a list over the features and how these can be implemented.

# Building
:grey_exclamation: **This has been tested to work with node 18.3**

You can build this script from source using `node` and `npm`.

**Clone repository and install dependencies:**
```
git clone https://github.com/sixem/eyy-indexer
cd eyy-indexer
npm install
```

## Production builds

Build from source, creating minified files:
```
npm run build
```

Build a standalone file from source:
```
npm run make-standalone
```

## Development builds

Build source mapped, non-production files:
```
npm run build-dev
```

# Contributing
You can contribute by either submitting a pull request, reporting issues or bugs, or voicing good ideas. It's all very much welcome! :relaxed:

## License
This project is licensed under GPL-3.0. It also includes external libraries that are available under a variety of licenses. See [LICENSE](LICENSE) for the full license text.

## Disclaimer
**As you with anything else, use this script at your own risk. There may exist bugs that i do not know of.**